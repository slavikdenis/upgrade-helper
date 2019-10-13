import React, { useState } from 'react'
import { Popover, Button, Checkbox } from 'antd'
import { SHOW_LATEST_RCS, HIGHLIGHT_WHITESPACE_CHANGES } from '../../utils'

const Settings = ({ handleSettingsChange }) => {
  const [popoverVisibility, setVisibility] = useState(false)

  const handleClickChange = visibility => setVisibility(visibility)

  const updateCheckboxValues = checkboxValues =>
    handleSettingsChange(checkboxValues)

  return (
    <Popover
      placement="bottomRight"
      content={
        <Checkbox.Group
          onChange={updateCheckboxValues}
          defaultValue={[HIGHLIGHT_WHITESPACE_CHANGES]}
        >
          <div>
            <Checkbox value={SHOW_LATEST_RCS}>{SHOW_LATEST_RCS}</Checkbox>
          </div>
          <div>
            <Checkbox value={HIGHLIGHT_WHITESPACE_CHANGES}>
              {HIGHLIGHT_WHITESPACE_CHANGES}
            </Checkbox>
          </div>
        </Checkbox.Group>
      }
      trigger="click"
      visible={popoverVisibility}
      onVisibleChange={handleClickChange}
    >
      <Button icon="setting" />
    </Popover>
  )
}

export default Settings
