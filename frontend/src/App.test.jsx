import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import App from './App'

describe('App', () => {
  it('renders app', () => {
    render(<App />)
    expect(document.body).toBeTruthy()
  })
})