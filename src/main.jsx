import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import CareerAssessmentTool from './career-assessment-tool.jsx'
import FeedbackForm from './FeedbackForm.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CareerAssessmentTool />} />
        <Route path="/feedback/:requestId" element={<FeedbackForm />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
