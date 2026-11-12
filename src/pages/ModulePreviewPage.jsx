import { ArrowLeft, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function ModulePreviewPage({ title, description }) {
  return (
    <section className="page-content">
      <div className="preview-heading"><p className="eyebrow">A more mindful everyday</p><h1>{title}</h1></div>
      <div className="panel preview-panel"><h2>{description}</h2><p>This space is part of the FitLife app plan. Its interactive tools will be added in the upcoming feature stages.</p><span className="preview-note"><Sparkles size={14} /> Foundation preview</span><div><Link className="text-action" style={{ marginTop: 21 }} to="/"><ArrowLeft size={13} /> Back to overview</Link></div></div>
    </section>
  )
}