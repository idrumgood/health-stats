import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Setup from './Setup';
import Dashboard from './Dashboard';

function App() {
  return (
    <Router>
      <div>
        <nav style={{display:'flex', gap:'1rem', padding:'1rem', background:'#333', color:'#fff'}}>
            <Link to="/" style={{color:'#fff'}}>Dashboard</Link>
            <Link to="/setup" style={{color:'#fff'}}>Setup</Link>
        </nav>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/setup" element={<Setup />} />
        </Routes>
      </div>
    </Router>
  );
}
export default App;
