import { Link } from 'react-router-dom'

/** Sleek minimal footer — DPDP privacy note + exact required credit line. */
export function SiteFooter() {
  return (
    <footer className="site-footer no-print">
      <div className="footer-inner">
        <div className="footer-top">
          <div className="footer-brand">
            <div className="brand">
              <span className="brand-dot" />
              SugarSprint
            </div>
            <p>
              30-day micro-habit sprints that turn diabetes self-care into a daily two-minute
              win — with streaks, caregiver cheers, and doctor-ready summaries.
            </p>
          </div>
          <nav className="footer-links" aria-label="Footer">
            <div className="footer-col">
              <h5>Product</h5>
              <Link to="/">Home</Link>
              <Link to="/app">Start a Sprint</Link>
              <Link to="/care">Caregiver Mode</Link>
              <Link to="/report">Doctor Report</Link>
            </div>
            <div className="footer-col">
              <h5>Sprints</h5>
              <Link to="/app">Glucose Logging</Link>
              <Link to="/app">10-Min Post-Dinner Walk</Link>
              <Link to="/app">Med on Time</Link>
            </div>
            <div className="footer-col">
              <h5>Trust &amp; Safety</h5>
              <a href="#privacy">Privacy Policy</a>
              <a href="#terms">Terms of Use</a>
              <a href="#security">Security</a>
            </div>
          </nav>
        </div>
        <div className="footer-bottom">
          <span className="privacy" id="privacy">
            🔒 Designed with DPDP Act 2023 (India) principles — explicit consent, data
            minimisation, ephemeral AI media, and 1-tap “Delete My Account &amp; Data”.
            © {new Date().getFullYear()} SugarSprint.
          </span>
          <span className="credit">Made with ❤️ by Starway</span>
        </div>
      </div>
    </footer>
  )
}
