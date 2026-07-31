import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, FileUp, ListChecks } from "lucide-react";
import { api, type ProdutoExtraido, type UploadResponse } from "@/lib/api";
import { PageHeader } from "@/components/layout/PageHeader";
import { Step1Upload } from "./Step1Upload";
import { Step2Revisao } from "./Step2Revisao";
import { Step3Confirmacao } from "./Step3Confirmacao";
import { cn } from "@/lib/utils";

type Step = 1 | 2 | 3;

const STEPS: { n: Step; label: string; icon: any }[] = [
  { n: 1, label: "Upload do XML", icon: FileUp },
  { n: 2, label: "Revisão", icon: ListChecks },
  { n: 3, label: "Confirmação", icon: Check },
];

export function ImportarNFe() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [step, setStep] = useState<Step>(1);
  const [nfeId, setNfeId] = useState<string | number | null>(null);
  const [produtos, setProdutos] = useState<ProdutoExtraido[]>([]);

  const upload = useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.append("file", file);
      const { data } = await api.post<UploadResponse>("/api/upload", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data;
    },
    onSuccess: (data) => {
      setNfeId(data.invoice_id);
      setProdutos(data.products ?? []);
      setStep(2);
      toast.success(`${data.products?.length ?? 0} produto(s) extraído(s) da NF-e`);
    },
    onError: (e: any) => toast.error(e?.response?.data?.error ?? e?.message ?? "Falha no upload"),
  });

  const confirm = useMutation({
    mutationFn: async () =>
      (
        await api.post("/api/update-costs", {
          invoice_id: nfeId,
          updates: produtos,
        })
      ).data,
    onSuccess: () => {
      toast.success("Custos e estoque atualizados");
      qc.invalidateQueries({ queryKey: ["produtos"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["relatorios"] });
      navigate("/produtos");
    },
    onError: (e: any) => toast.error(e?.message ?? "Falha ao atualizar"),
  });

  return (
    <div>
      <PageHeader
        eyebrow="Entrada"
        title="Importar NF-e"
        description="Suba o XML da nota, revise os itens e confirme a atualização de custos e estoque."
      />
      <div className="p-6">
        <ol className="mb-6 grid grid-cols-3 gap-2">
          {STEPS.map(({ n, label, icon: Icon }) => {
            const done = step > n;
            const current = step === n;
            return (
              <li
                key={n}
                className={cn(
                  "flex items-center gap-3 rounded-md border bg-card px-4 py-3 text-sm",
                  current ? "border-primary" : done ? "border-success/40" : "border-border",
                )}
              >
                <div
                  className={cn(
                    "grid h-8 w-8 shrink-0 place-items-center rounded-md font-mono text-xs font-bold",
                    current
                      ? "bg-primary text-primary-foreground"
                      : done
                      ? "bg-success text-success-foreground"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {done ? <Check className="h-4 w-4" /> : n}
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                    Passo {n}
                  </div>
                  <div className="truncate font-display font-semibold">{label}</div>
                </div>
                <Icon className="ml-auto hidden h-4 w-4 text-muted-foreground sm:block" />
              </li>
            );
          })}
        </ol>

        <div className="rounded-lg border border-border bg-card">
          {step === 1 && (
            <Step1Upload
              onSubmit={(f) => upload.mutate(f)}
              isSubmitting={upload.isPending}
            />
          )}
          {step === 2 && (
            <Step2Revisao
              produtos={produtos}
              onBack={() => setStep(1)}
              onContinue={() => setStep(3)}
            />
          )}
          {step === 3 && (
            <Step3Confirmacao
              produtos={produtos}
              onBack={() => setStep(2)}
              onConfirm={() => confirm.mutate()}
              isSubmitting={confirm.isPending}
            />
          )}
        </div>
      </div>
    </div>
  );
}
