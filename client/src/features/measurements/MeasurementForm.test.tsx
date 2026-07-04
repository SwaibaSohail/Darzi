import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MeasurementForm } from './MeasurementForm'

const onSave = vi.fn()
const onCancel = vi.fn()

beforeEach(() => {
  onSave.mockReset()
  onCancel.mockReset()
})

function renderForm() {
  return render(<MeasurementForm onSave={onSave} onCancel={onCancel} saving={false} />)
}

describe('MeasurementForm', () => {
  it('requires a label', async () => {
    renderForm()
    await userEvent.type(screen.getByLabelText(/Chest/), '102')
    await userEvent.click(screen.getByRole('button', { name: 'Save profile' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/profile a name/i)
    expect(onSave).not.toHaveBeenCalled()
  })

  it('requires at least one measurement', async () => {
    renderForm()
    await userEvent.type(screen.getByLabelText('Profile name'), 'My fit')
    await userEvent.click(screen.getByRole('button', { name: 'Save profile' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/at least one/i)
    expect(onSave).not.toHaveBeenCalled()
  })

  it('submits parsed numeric values with unit', async () => {
    renderForm()
    await userEvent.type(screen.getByLabelText('Profile name'), 'My fit')
    await userEvent.click(screen.getByRole('radio', { name: 'in' }))
    await userEvent.type(screen.getByLabelText(/Chest/), '40')
    await userEvent.type(screen.getByLabelText(/Waist/), '34')
    await userEvent.click(screen.getByRole('button', { name: 'Save profile' }))
    expect(onSave).toHaveBeenCalledWith({
      label: 'My fit',
      unit: 'in',
      values: { chest: 40, waist: 34 },
      notes: '',
    })
  })
})
