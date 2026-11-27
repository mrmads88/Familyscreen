# Tilføjelser til Nemlig-integrationen (DruonDK/ha-nemlig)

Tavlen bruger to små tilføjelser i Nemlig-integrationen til Home Assistant. De ligger i
`custom_components/nemlig/` og **forsvinder, når integrationen opdateres** – så sæt dem ind igen.
Rediger filerne med tilføjelsen *File editor* og genstart Home Assistant bagefter.

Uden tilføjelserne virker tavlen stadig – der er bare ingen varebilleder, og kurven kan ikke rettes fra tavlen.

## 1. Varebilleder – `services.py`

I funktionen `_product`, lige under linjen `"name": raw.get("Name"),`, med samme indrykning:

```python
        "image_url": raw.get("PrimaryImage"),
```

## 2. Ret antal / fjern vare i kurven – `services.py` og `services.yaml`

Handlingen `nemlig.set_quantity` (product_id, quantity; 0 fjerner varen). Den bruger integrationens egne
funktioner `set_basket_quantity` og `remove_from_basket`, så den kalder intet nyt hos nemlig.com.

**a)** Under linjen `SERVICE_SEARCH = "search"`:

```python
SERVICE_SET_QUANTITY = "set_quantity"  # Familietavle-tilføjelse
```

**b)** Lige før `@callback` / `def async_setup_services`:

```python
# Familietavle-tilføjelse: sæt antal (0 = fjern) for en vare i kurven
SET_QUANTITY_SCHEMA = vol.Schema(
    {
        vol.Optional(ATTR_CONFIG_ENTRY_ID): cv.string,
        vol.Required(ATTR_PRODUCT_ID): cv.string,
        vol.Required(ATTR_QUANTITY): vol.All(vol.Coerce(int), vol.Range(min=0, max=50)),
    }
)
```

**c)** I `async_setup_services`, efter registreringen af `SERVICE_SEARCH`:

```python
    hass.services.async_register(  # Familietavle-tilføjelse
        DOMAIN,
        SERVICE_SET_QUANTITY,
        _set_quantity,
        schema=SET_QUANTITY_SCHEMA,
        supports_response=SupportsResponse.OPTIONAL,
    )
```

**d)** Nederst i filen:

```python
# Familietavle-tilføjelse: bruger integrationens egne set_basket_quantity/remove_from_basket
async def _set_quantity(call: ServiceCall) -> ServiceResponse:
    """Set the absolute quantity of a product in the live basket (0 removes it)."""
    data = _data(call)
    product_id: str = call.data[ATTR_PRODUCT_ID]
    quantity: int = call.data[ATTR_QUANTITY]
    try:
        if quantity == 0:
            raw = await data.client.remove_from_basket(product_id)
        else:
            raw = await data.client.set_basket_quantity(product_id, quantity)
        basket = Basket.from_api(raw)
    except NemligError as err:
        raise _api_error(err) from err

    data.basket.async_set_updated_data(basket)
    line = basket.line(product_id)
    return {
        "status": "removed" if line is None else "updated",
        "product_id": product_id,
        "quantity": 0 if line is None else line.quantity,
        **_basket_summary(basket),
    }
```

**e)** Nederst i `services.yaml`:

```yaml
set_quantity:
  fields:
    config_entry_id:
      selector:
        config_entry:
          integration: nemlig
    product_id:
      required: true
      example: "701025"
      selector:
        text:
    quantity:
      required: true
      example: 2
      selector:
        number:
          min: 0
          max: 50
          mode: box
```

Tjek bagefter under *Udviklerværktøjer → Handlinger*, at `nemlig.set_quantity` findes.
