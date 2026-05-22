import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { ToastProvider } from './components/ui/Toast'
import { RoleProvider } from './lib/roleContext'
import { Dashboard } from './pages/Dashboard'
import { CampaignList } from './pages/CampaignList'
import { CampaignDetail } from './pages/CampaignDetail'
import { CampaignBuilder } from './pages/CampaignBuilder'
import { TemplateManagement } from './pages/TemplateManagement'
import { TemplateEditor } from './pages/TemplateEditor'
import { TriggerManagement } from './pages/TriggerManagement'
import { BlacklistManagement } from './pages/BlacklistManagement'
import { CustomerList } from './pages/CustomerList'
import { Customer360 } from './pages/Customer360'
import { Report } from './pages/Report'
import { AdminScreen } from './pages/AdminScreen'
import { Settings } from './pages/Settings'

export default function App() {
  return (
    <BrowserRouter>
      <RoleProvider>
      <ToastProvider>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="campaigns" element={<CampaignList />} />
            <Route path="campaigns/new" element={<CampaignBuilder />} />
            <Route path="campaigns/:id/edit" element={<CampaignBuilder />} />
            <Route path="campaigns/:id/detail" element={<CampaignDetail />} />
            <Route path="templates" element={<TemplateManagement />} />
            <Route path="templates/new" element={<TemplateEditor />} />
            <Route path="templates/:id" element={<TemplateEditor />} />
            <Route path="triggers" element={<TriggerManagement />} />
            <Route path="blacklist" element={<BlacklistManagement />} />
            <Route path="customers" element={<CustomerList />} />
            <Route path="customers/:phone/360" element={<Customer360 />} />
            <Route path="report" element={<Report />} />
            <Route path="admin" element={<AdminScreen />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </ToastProvider>
      </RoleProvider>
    </BrowserRouter>
  )
}
