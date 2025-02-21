import 'normalize.css'
import './popup.less'
import { useState } from 'react'
import { Input } from 'antd'
import { PopupMessaging } from '@crx-api/messaging'

const Msg = new PopupMessaging()

function IndexPopup() {
  const [data, setData] = useState('')

  return (
    <div className="popup-container">
      <Input onChange={(e) => setData(e.target.value)} value={data} />
    </div>
  )
}

export default IndexPopup