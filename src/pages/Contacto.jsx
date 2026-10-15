import { useState } from 'react'
import Campo from '../components/Campo'
import { mensajes } from '../data/db'
import { validarCorreo, validarTexto } from '../domain/validaciones'

const INICIAL = { nombre: '', correo: '', comentario: '' }

function Contacto() {
  const [valores, setValores] = useState(INICIAL)
  const [errores, setErrores] = useState({})
  const [resultado, setResultado] = useState(null)

  const cambiar = (campo) => (e) => setValores((v) => ({ ...v, [campo]: e.target.value }))

  const enviar = (evento) => {
    evento.preventDefault()
    const nuevos = {
      nombre: validarTexto(valores.nombre, { etiqueta: 'El nombre', maximo: 100 }),
      correo: validarCorreo(valores.correo),
      comentario: validarTexto(valores.comentario, { etiqueta: 'El comentario', maximo: 500 }),
    }
    setErrores(nuevos)
    if (Object.values(nuevos).some(Boolean)) {
      setResultado({ tipo: 'danger', texto: 'Revisa los campos marcados antes de enviar tu mensaje.' })
      return
    }
    mensajes.crear({
      id: 'M' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      nombre: valores.nombre.trim(),
      correo: valores.correo.trim(),
      comentario: valores.comentario.trim(),
      fecha: new Date().toISOString(),
    })
    setResultado({ tipo: 'success', texto: `¡Gracias, ${valores.nombre.trim()}! Recibimos tu mensaje y te responderemos a la brevedad.` })
    setValores(INICIAL)
  }

  return (
    <section className="seccion">
      <div className="container">
        <div className="row g-5">
          <div className="col-lg-5">
            <h1>Conversemos</h1>
            <p className="intro-seccion">
              ¿Tienes dudas sobre un plan, un taller o quieres saber si tu previsión cubre parte de la atención?
              Escríbenos y te respondemos dentro de un día hábil.
            </p>
            <h2 className="h6">Cómo encontrarnos</h2>
            <address className="mb-3">
              Av. Alemania 0671, Temuco, Región de La Araucanía.<br />
              Lunes a viernes, 08:00 a 19:00 horas.<br />
              <a href="mailto:contacto@nutrivida.cl">contacto@nutrivida.cl</a>
            </address>
          </div>
          <div className="col-lg-7">
            <form className="tarjeta-formulario" onSubmit={enviar} noValidate>
              <Campo id="contacto-nombre" etiqueta="Nombre" value={valores.nombre} onChange={cambiar('nombre')}
                error={errores.nombre} placeholder="Tu nombre completo" maxLength={100} />
              <Campo id="contacto-correo" etiqueta="Correo electrónico" type="email" value={valores.correo}
                onChange={cambiar('correo')} error={errores.correo} placeholder="nombre@correo.com" maxLength={100} />
              <Campo id="contacto-comentario" etiqueta="Comentario" as="textarea" rows={5} value={valores.comentario}
                onChange={cambiar('comentario')} error={errores.comentario} maxLength={500}
                placeholder="Cuéntanos en qué te podemos ayudar" />
              <span className="contador-caracteres" aria-live="polite">{valores.comentario.length} / 500</span>
              {resultado && <div role="status" className={`alert alert-${resultado.tipo} mt-3`}>{resultado.texto}</div>}
              <button type="submit" className="btn btn-nv-primario w-100 mt-2">Enviar mensaje</button>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Contacto
