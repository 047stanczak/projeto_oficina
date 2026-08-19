from datetime import datetime

from xml_parser import extract_invoice_products
from repository import invoice_repository, product_repository, history_repository


def process_upload(file_path):
    return extract_invoice_products(file_path)


def register_invoice(cursor, file_name):
    return invoice_repository.create_invoice(cursor, "1", "1", datetime.now().date(), "Supplier", file_name)


def update_costs(cursor, invoice_id, updates):
    for upd in updates:
        code = upd.get("code")
        new_cost = upd.get("new_cost")
        quantity = upd.get("quantity", 0)

        result = product_repository.find_by_code(cursor, code)

        if result:
            product_id, old_cost = result
            history_repository.register_purchase_history(
                cursor, product_id, old_cost, new_cost, quantity, invoice_id, datetime.now()
            )
            product_repository.update_cost_and_stock(cursor, product_id, new_cost, quantity)
        else:
            product_repository.create_product(cursor, code, upd.get("name", "Product"), new_cost, quantity)

def calcular_rateio_custos_adicionais(itens: list, totais: dict) -> list:
    custo_adicional_total = totais.get('vFrete', 0) + totais.get('vSeg', 0) + totais.get('vOutro', 0) - totais.get('vDesc', 0)
    v_prod_total = totais.get('vProdTotal', 0)
    itens_com_custo_real = []

    for item in itens:
        peso_do_item = (item['valorProduto'] / v_prod_total) if v_prod_total > 0 else 0
        rateio_do_item = custo_adicional_total * peso_do_item
        custo_efetivo_real_total = item['valorProduto'] + rateio_do_item
        
        quantidade = item.get('quantidade', 1)
        custo_unitario_real = custo_efetivo_real_total / quantidade

        item_atualizado = item.copy()
        item_atualizado['rateioAplicado'] = round(rateio_do_item, 4)
        item_atualizado['custoEfetivoRealTotal'] = round(custo_efetivo_real_total, 4)
        item_atualizado['custoUnitarioReal'] = round(custo_unitario_real, 4)

        itens_com_custo_real.append(item_atualizado)

    return itens_com_custo_real

if __name__ == "__main__":
    totais_extraidos = {
        'vFrete': 50.00,
        'vSeg': 10.00,
        'vOutro': 5.00,
        'vDesc': 15.00,
        'vProdTotal': 1000.00
    }

    itens_extraidos = [
        {'id': 1, 'nome': "Peça A", 'valorProduto': 200.00, 'quantidade': 2},
        {'id': 2, 'nome': "Peça B", 'valorProduto': 800.00, 'quantidade': 4}
    ]

    resultado = calcular_rateio_custos_adicionais(itens_extraidos, totais_extraidos)
    
    for r in resultado:
        print(f"Item: {r['nome']} | Custo Adicional Rateado: R${r['rateioAplicado']} | Custo Unitário Real: R${r['custoUnitarioReal']}")