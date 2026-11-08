import { useState } from 'react'
import { MapContainer, Marker, Polyline, Popup, TileLayer } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import iconoMarcador from 'leaflet/dist/images/marker-icon.png'
import iconoMarcador2x from 'leaflet/dist/images/marker-icon-2x.png'
import sombraMarcador from 'leaflet/dist/images/marker-shadow.png'
import { CLINICA } from '../config/clinica'

// Vite no resuelve las imágenes por defecto de Leaflet; se indican explícitamente.
const icono = L.icon({
  iconUrl: iconoMarcador,
  iconRetinaUrl: iconoMarcador2x,
  shadowUrl: sombraMarcador,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
})

// Distancia en línea recta (fórmula del haversine), en kilómetros.
export function distanciaKm([lat1, lon1], [lat2, lon2]) {
  const rad = (g) => (g * Math.PI) / 180
  const a = Math.sin(rad(lat2 - lat1) / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lon2 - lon1) / 2) ** 2
  return Math.round(6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10
}

function MapaClinica() {
  const [miUbicacion, setMiUbicacion] = useState(null)
  const [estado, setEstado] = useState('')

  const ubicarme = () => {
    if (!navigator.geolocation) {
      setEstado('Tu navegador no permite compartir la ubicación.')
      return
    }
    setEstado('Buscando tu ubicación…')
    navigator.geolocation.getCurrentPosition(
      (posicion) => {
        const punto = [posicion.coords.latitude, posicion.coords.longitude]
        setMiUbicacion(punto)
        setEstado(`Estás a unos ${distanciaKm(punto, CLINICA.coordenadas)} km en línea recta de la clínica.`)
      },
      () => setEstado('No pudimos obtener tu ubicación. Revisa los permisos del navegador.'),
      { timeout: 10000 },
    )
  }

  const [lat, lng] = CLINICA.coordenadas
  const indicaciones = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`

  return (
    <div className="mapa-clinica">
      <MapContainer center={CLINICA.coordenadas} zoom={15} scrollWheelZoom={false} className="mapa-contenedor"
        aria-label={`Mapa con la ubicación de NutriVida en ${CLINICA.direccion}`}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={CLINICA.coordenadas} icon={icono}>
          <Popup><strong>NutriVida</strong><br />{CLINICA.direccion}</Popup>
        </Marker>
        {miUbicacion && (
          <>
            <Marker position={miUbicacion} icon={icono}><Popup>Tu ubicación</Popup></Marker>
            <Polyline positions={[miUbicacion, CLINICA.coordenadas]} pathOptions={{ color: '#2f6b4f', dashArray: '6 6' }} />
          </>
        )}
      </MapContainer>
      <div className="d-flex flex-wrap gap-2 mt-2">
        <button type="button" className="btn btn-nv-secundario btn-sm" onClick={ubicarme}>Usar mi ubicación</button>
        <a className="btn btn-nv-primario btn-sm" href={indicaciones} target="_blank" rel="noopener noreferrer">
          Cómo llegar (Google Maps)
        </a>
      </div>
      {estado && <p className="texto-ayuda mt-2 mb-0" role="status">{estado}</p>}
    </div>
  )
}

export default MapaClinica
