import { render, screen } from '@testing-library/react'
import App from './App'

describe('App', () => {
  it('renders the Darzi brand heading', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Darzi' })).toBeInTheDocument()
  })
})
