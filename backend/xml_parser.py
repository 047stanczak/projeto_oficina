from lxml import etree

import validators

def extract_invoice_products(xml_path):
    """Extracts products from the NF-e XML"""
    
    parser = etree.XMLParser(resolve_entities=False, no_network=True, load_dtd=False)
    tree = etree.parse(xml_path, parser)
    root = tree.getroot()
    
    ns = {"nfe": "http://www.portalfiscal.inf.br/nfe"}
    
    products = []
    
    for det in root.findall(".//nfe:det", ns):
        prod = det.find("nfe:prod", ns)
        
        if prod is not None:
            code = validators.text(prod.findtext("nfe:cProd", "", ns), "cProd", 20)
            name = validators.text(prod.findtext("nfe:xProd", "", ns), "xProd", 255)
            unit_value = validators.number(float(prod.findtext("nfe:vUnCom", "0", ns)), "vUnCom")
            quantity = validators.number(float(prod.findtext("nfe:qCom", "0", ns)), "qCom", 0, validators.MAX_INT)
            
            products.append({
                "code": code,
                "name": name,
                "new_cost": unit_value,
                "quantity": int(quantity)
            })
    
    return products