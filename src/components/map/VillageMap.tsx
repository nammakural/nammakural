import { useCallback, useMemo, useState } from 'react'
import { LIVE_MAPS_API_KEY } from '@/lib/mapsKey'
import { GoogleMap, Marker, useJsApiLoader, InfoWindow } from '@react-google-maps/api'
import { Link } from 'react-router-dom'
import type { Complaint } from '@/types'
import { DEFAULT_VILLAGE, CATEGORY_LABELS } from '@/constants'
import { getMapMarkerColor, statusLabel } from '@/utils'
import { Spinner } from '@/components/ui'

const containerStyle = { width: '100%', height: '100%', borderRadius: '1rem' }

export function VillageMap({
  complaints,
  height = '420px',
  center,
  onPickLocation,
  pickMode = false,
}: {
  complaints: Complaint[]
  height?: string
  center?: { lat: number; lng: number }
  onPickLocation?: (lat: number, lng: number) => void
  pickMode?: boolean
}) {
  const envKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined
  const apiKey =
    envKey && envKey !== 'your_google_maps_api_key' ? envKey : LIVE_MAPS_API_KEY
  const hasKey = Boolean(apiKey)
  const mapCenter = center || DEFAULT_VILLAGE.center

  if (!hasKey) {
    return (
      <EmbeddedVillageMap
        complaints={complaints}
        height={height}
        center={mapCenter}
        onPick={onPickLocation}
        pickMode={pickMode}
      />
    )
  }

  return (
    <GoogleMapInner
      apiKey={apiKey!}
      complaints={complaints}
      height={height}
      center={mapCenter}
      onPickLocation={onPickLocation}
      pickMode={pickMode}
    />
  )
}

function GoogleMapInner({
  apiKey,
  complaints,
  height,
  center,
  onPickLocation,
  pickMode,
}: {
  apiKey: string
  complaints: Complaint[]
  height: string
  center: { lat: number; lng: number }
  onPickLocation?: (lat: number, lng: number) => void
  pickMode: boolean
}) {
  const { isLoaded } = useJsApiLoader({
    id: 'localvoice-map',
    googleMapsApiKey: apiKey,
  })
  const [active, setActive] = useState<Complaint | null>(null)

  const onClick = useCallback(
    (e: { latLng?: { lat: () => number; lng: () => number } | null }) => {
      if (!pickMode || !onPickLocation || !e.latLng) return
      onPickLocation(e.latLng.lat(), e.latLng.lng())
    },
    [pickMode, onPickLocation],
  )

  const markers = useMemo(() => complaints, [complaints])

  if (!isLoaded) {
    return (
      <div
        className="flex items-center justify-center rounded-2xl border dark:border-vc-border border-light-border"
        style={{ height }}
      >
        <Spinner />
      </div>
    )
  }

  return (
    <div style={{ height }} className="overflow-hidden rounded-2xl border dark:border-vc-border border-light-border">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={16}
        onClick={onClick}
        options={{
          disableDefaultUI: false,
          mapTypeId: 'hybrid',
          mapTypeControl: true,
        }}
      >
        {markers.map((c) => (
          <Marker
            key={c.id}
            position={{ lat: c.location.lat, lng: c.location.lng }}
            onClick={() => setActive(c)}
          />
        ))}
        {active ? (
          <InfoWindow
            position={{ lat: active.location.lat, lng: active.location.lng }}
            onCloseClick={() => setActive(null)}
          >
            <div className="text-slate-900 p-1 max-w-[200px]">
              <p className="font-semibold text-sm">{active.complaintId}</p>
              <p className="text-xs">
                {CATEGORY_LABELS[active.category]} · {statusLabel(active.status)}
              </p>
              <Link className="text-xs text-sky-600 underline" to={`/complaints/${active.complaintId}`}>
                View details
              </Link>
            </div>
          </InfoWindow>
        ) : null}
      </GoogleMap>
    </div>
  )
}

/** Real Google Maps embed of Thiruppair (works without API key) */
function EmbeddedVillageMap({
  complaints,
  height,
  center,
  onPick,
  pickMode,
}: {
  complaints: Complaint[]
  height: string
  center: { lat: number; lng: number }
  onPick?: (lat: number, lng: number) => void
  pickMode?: boolean
}) {
  const [selected, setSelected] = useState<Complaint | null>(null)
  const embedSrc =
    DEFAULT_VILLAGE.mapsEmbedUrl ||
    `https://maps.google.com/maps?q=${center.lat},${center.lng}&z=16&t=k&output=embed`

  const project = (lat: number, lng: number) => {
    const scale = 12000
    const x = 50 + (lng - center.lng) * scale
    const y = 50 - (lat - center.lat) * scale
    return { left: `${Math.min(92, Math.max(8, x))}%`, top: `${Math.min(88, Math.max(12, y))}%` }
  }

  return (
    <div
      className="relative overflow-hidden rounded-2xl border dark:border-vc-border border-light-border bg-[#0d1117]"
      style={{ height }}
      onClick={(e) => {
        if (!pickMode || !onPick) return
        const rect = e.currentTarget.getBoundingClientRect()
        const px = (e.clientX - rect.left) / rect.width
        const py = (e.clientY - rect.top) / rect.height
        const lng = center.lng + (px - 0.5) / 100
        const lat = center.lat - (py - 0.5) / 100
        onPick(lat, lng)
      }}
    >
      <iframe
        title={`${DEFAULT_VILLAGE.name} village map`}
        src={embedSrc}
        className="absolute inset-0 h-full w-full border-0"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
      />

      <div className="absolute top-3 left-3 z-10 rounded-lg bg-black/65 backdrop-blur px-2.5 py-1.5 text-[10px] uppercase tracking-wider text-white/90">
        {DEFAULT_VILLAGE.name} · satellite
        {pickMode ? ' · tap to set pin' : ''}
      </div>

      <div className="absolute bottom-3 left-3 z-10 flex flex-wrap gap-2 text-[10px] text-white bg-black/65 backdrop-blur px-2.5 py-1.5 rounded-lg">
        <span className="flex items-center gap-1">
          <i className="h-2 w-2 rounded-full bg-red-500 inline-block" /> Pending
        </span>
        <span className="flex items-center gap-1">
          <i className="h-2 w-2 rounded-full bg-yellow-400 inline-block" /> In Progress
        </span>
        <span className="flex items-center gap-1">
          <i className="h-2 w-2 rounded-full bg-green-500 inline-block" /> Resolved
        </span>
      </div>

      {!pickMode
        ? complaints.map((c) => {
            const pos = project(c.location.lat, c.location.lng)
            return (
              <button
                key={c.id}
                type="button"
                className="absolute z-10 -translate-x-1/2 -translate-y-1/2 h-4 w-4 rounded-full border-2 border-white shadow-lg hover:scale-125 transition"
                style={{ ...pos, backgroundColor: getMapMarkerColor(c.status) }}
                title={c.complaintId}
                onClick={(e) => {
                  e.stopPropagation()
                  setSelected(c)
                }}
              />
            )
          })
        : null}

      {selected ? (
        <div className="absolute z-20 bottom-12 right-3 max-w-[220px] rounded-xl bg-[#151b24]/95 backdrop-blur border border-vc-border p-3 text-sm shadow-xl">
          <p className="font-semibold text-white">{selected.complaintId}</p>
          <p className="text-xs text-vc-muted mb-2">
            {CATEGORY_LABELS[selected.category]} · {statusLabel(selected.status)}
          </p>
          <Link to={`/complaints/${selected.complaintId}`} className="text-sky-400 text-xs underline">
            Open details →
          </Link>
          <button
            type="button"
            className="absolute top-2 right-2 text-vc-muted text-xs"
            onClick={() => setSelected(null)}
          >
            ✕
          </button>
        </div>
      ) : null}
    </div>
  )
}
