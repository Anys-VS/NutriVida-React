import Campo from './Campo'

// Campos de la tarjeta para el pago online simulado (no se guardan en ningún lado).
function CamposTarjeta({ valores, errores, onChange }) {
  const cambiar = (campo) => (evento) => onChange({ ...valores, [campo]: evento.target.value })

  return (
    <div className="row">
      <Campo id="tarjeta-titular" etiqueta="Nombre del titular" value={valores.titular} onChange={cambiar('titular')}
        error={errores.titular} claseWrapper="col-12 mb-3" autoComplete="cc-name" />
      <Campo id="tarjeta-numero" etiqueta="Número de tarjeta" value={valores.numero} onChange={cambiar('numero')}
        error={errores.numero} claseWrapper="col-12 mb-3" inputMode="numeric" maxLength={19} placeholder="1234 5678 9012 3456"
        ayuda="Para probar un pago rechazado, usa una tarjeta que termine en 0000." />
      <Campo id="tarjeta-vencimiento" etiqueta="Vencimiento" value={valores.vencimiento} onChange={cambiar('vencimiento')}
        error={errores.vencimiento} claseWrapper="col-6 mb-3" placeholder="MM/AA" maxLength={5} />
      <Campo id="tarjeta-cvv" etiqueta="CVV" value={valores.cvv} onChange={cambiar('cvv')}
        error={errores.cvv} claseWrapper="col-6 mb-3" inputMode="numeric" maxLength={3} />
    </div>
  )
}

export default CamposTarjeta
