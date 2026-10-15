// Campo de formulario con etiqueta, mensaje de error y ayuda. `as` permite input, select o textarea.
function Campo({ id, etiqueta, error, ayuda, as: Elemento = 'input', claseWrapper = 'mb-3', children, ...props }) {
  const base = Elemento === 'select' ? 'form-select' : 'form-control'

  return (
    <div className={claseWrapper}>
      <label htmlFor={id} className="form-label">{etiqueta}</label>
      <Elemento id={id} className={`${base}${error ? ' is-invalid' : ''}`} aria-invalid={Boolean(error)} {...props}>
        {children}
      </Elemento>
      {error && <div className="invalid-feedback">{error}</div>}
      {ayuda && <span className="texto-ayuda">{ayuda}</span>}
    </div>
  )
}

export default Campo
