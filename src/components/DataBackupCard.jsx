import { useRef, useState } from 'react'
import { useAppData } from '../context/AppDataContext.jsx'
import { useToast } from './Toast.jsx'
import { isoDateOnly } from '../lib/format.js'
import { Button } from './Ui.jsx'

function countRecords(data) {
  return {
    customers: data?.customers?.length ?? 0,
    appointments: data?.appointments?.length ?? 0,
    sessions:
      (data?.personalColorSessions?.length ?? 0) +
      (data?.makeupConsultSessions?.length ?? 0),
    products: data?.toneRecommendProducts?.length ?? 0,
  }
}

/**
 * 고객·예약·기록·제품 전체를 파일 하나로 내려받고 되돌립니다.
 * 서버 데이터베이스 파일에 접근하지 않아도 관리자가 직접 백업할 수 있게 합니다.
 */
export function DataBackupCard() {
  const { state, actions } = useAppData()
  const { toast } = useToast()
  const fileRef = useRef(null)
  const [busy, setBusy] = useState(false)

  const counts = countRecords(state)

  /**
   * 서버에 저장된 내용을 받아서 파일로 만듭니다. 서버에 닿지 못하면 이 기기에 있는
   * 사본으로 대신 만들고, 그 사실을 알려 줍니다.
   */
  async function download() {
    if (busy) return
    setBusy(true)
    let data = state
    let fromServer = true
    try {
      const response = await fetch('/api/state', {
        credentials: 'same-origin',
        headers: { Accept: 'application/json' },
      })
      if (!response.ok) throw new Error(String(response.status))
      data = await response.json()
    } catch {
      fromServer = false
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `klar-backup-${isoDateOnly()}.json`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
    setBusy(false)
    toast(
      fromServer
        ? '백업 파일을 내려받았습니다.'
        : '서버에 연결하지 못해 이 기기에 저장된 내용으로 백업했습니다.',
      fromServer ? undefined : { tone: 'info' },
    )
  }

  async function restore(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setBusy(true)
    try {
      const parsed = JSON.parse(await file.text())
      if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.customers)) {
        toast('KLAR 백업 파일이 아닙니다.', { tone: 'error' })
        return
      }
      const next = countRecords(parsed)
      const ok = window.confirm(
        `지금 데이터를 백업 파일 내용으로 덮어씁니다.\n\n` +
          `· 고객 ${counts.customers}명 → ${next.customers}명\n` +
          `· 예약 ${counts.appointments}건 → ${next.appointments}건\n` +
          `· 기록 ${counts.sessions}건 → ${next.sessions}건\n` +
          `· 제품 ${counts.products}개 → ${next.products}개\n\n` +
          `계속할까요?`,
      )
      if (!ok) return
      actions.replaceAllData(parsed)
      toast('백업 파일에서 데이터를 복원했습니다.')
    } catch {
      toast('파일을 읽지 못했습니다. 올바른 백업 파일인지 확인해 주세요.', {
        tone: 'error',
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-xs leading-5 text-ink-muted">
        고객 {counts.customers}명 · 예약 {counts.appointments}건 · 기록{' '}
        {counts.sessions}건 · 제품 {counts.products}개를 파일 하나로 저장합니다. 기기를
        바꾸거나 되돌릴 때 사용하세요.
      </p>

      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="secondary"
          icon="link"
          className="whitespace-nowrap"
          disabled={busy}
          onClick={download}
        >
          내려받기
        </Button>
        <Button
          variant="secondary"
          icon="plus"
          className="whitespace-nowrap"
          disabled={busy}
          onClick={() => fileRef.current?.click()}
        >
          불러오기
        </Button>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={restore}
      />

      <p className="rounded-md bg-amber-50 px-3.5 py-3 text-xs leading-5 text-amber-700">
        불러오기를 하면 현재 데이터가 파일 내용으로 완전히 바뀝니다. 먼저 백업을 받아 두세요.
      </p>
    </div>
  )
}
