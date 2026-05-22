import { createContext, useContext, useState, type ReactNode } from 'react'

type Role = 'admin' | 'qtv'

interface RoleContextValue {
  role: Role
  isAdmin: boolean
  setRole: (r: Role) => void
}

const RoleContext = createContext<RoleContextValue>({ role: 'admin', isAdmin: true, setRole: () => {} })

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>('admin')
  return (
    <RoleContext.Provider value={{ role, isAdmin: role === 'admin', setRole }}>
      {children}
    </RoleContext.Provider>
  )
}

export function useRole() {
  return useContext(RoleContext)
}
