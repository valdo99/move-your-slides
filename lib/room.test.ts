import { generateRoomCode } from './room'

describe('generateRoomCode', () => {
  it('returns a 6-character string', () => {
    expect(generateRoomCode()).toHaveLength(6)
  })

  it('only contains uppercase letters and digits', () => {
    const code = generateRoomCode()
    expect(code).toMatch(/^[A-Z0-9]{6}$/)
  })

  it('generates different codes on consecutive calls', () => {
    const codes = new Set(Array.from({ length: 20 }, generateRoomCode))
    expect(codes.size).toBeGreaterThan(1)
  })
})
