import { useRef, useState } from "react";
import { FileUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Step1Upload({
  onSubmit,
  isSubmitting,
}: {
  onSubmit: (file: File) => void;
  isSubmitting: boolean;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="p-6">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          const f = e.dataTransfer.files?.[0];
          if (f) setFile(f);
        }}
        className={
          "grid place-items-center rounded-md border-2 border-dashed p-12 text-center transition-colors " +
          (drag ? "border-primary bg-primary/5" : "border-border")
        }
      >
        <div className="grid h-14 w-14 place-items-center rounded-md bg-primary/15 text-primary">
          <FileUp className="h-6 w-6" />
        </div>
        <div className="mt-4 font-display text-lg font-semibold">
          Arraste o XML da NF-e aqui
        </div>
        <p className="mt-1 text-sm text-muted-foreground">ou selecione manualmente um arquivo .xml</p>
        <input
          ref={inputRef}
          type="file"
          accept=".xml,text/xml,application/xml"
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <Button variant="outline" className="mt-4" onClick={() => inputRef.current?.click()}>
          Selecionar arquivo
        </Button>
        {file && (
          <div className="mt-4 font-mono text-xs text-muted-foreground">
            {file.name} · {(file.size / 1024).toFixed(1)} KB
          </div>
        )}
      </div>

      <div className="mt-6 flex justify-end">
        <Button onClick={() => file && onSubmit(file)} disabled={!file || isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processando...
            </>
          ) : (
            "Enviar e extrair produtos"
          )}
        </Button>
      </div>
    </div>
  );
}
