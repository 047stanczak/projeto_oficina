from lxml import etree

def extract_invoice_products(xml_path):
    """Extracts products from the NF-e XML"""
    
    tree = etree.parse(xml_path)
    root = tree.getroot()
    
    ns = {"nfe": "http://www.portalfiscal.inf.br/nfe"}
    
    products = []
    
    for det in root.findall(".//nfe:det", ns):
        prod = det.find("nfe:prod", ns)
        
        if prod is not None:
            code = prod.findtext("nfe:cProd", "", ns)
            name = prod.findtext("nfe:xProd", "", ns)
            unit_value = float(prod.findtext("nfe:vUnCom", "0", ns))
            quantity = float(prod.findtext("nfe:qCom", "0", ns))
            
            products.append({
                "code": code,
                "name": name.strip(),
                "new_cost": unit_value,
                "quantity": int(quantity)
            })
    
    return products