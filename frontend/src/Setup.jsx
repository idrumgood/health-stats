import React, { useEffect, useState } from 'react';
import axios from 'axios';

function Setup() {
    const [status, setStatus] = useState({ strava: false, whoop: false });
    const [syncing, setSyncing] = useState(false);
    const [syncMessage, setSyncMessage] = useState('');

    useEffect(() => { checkStatus(); }, []);

    const checkStatus = async () => {
        const res = await axios.get('http://localhost:3000/api/auth/status');
        setStatus(res.data);
    };

    const handleAuth = async (service) => {
        const res = await axios.get(`http://localhost:3000/api/auth/${service}`);
        window.open(res.data.url, '_blank');
    };

    const handleSync = async () => {
        setSyncing(true); setSyncMessage('Syncing...');
        try {
            const res = await axios.post('http://localhost:3000/api/sync');
            setSyncMessage(`Sync complete!`);
        } catch { setSyncMessage('Sync failed.'); }
        setSyncing(false);
    };

    return (
        <div style={{ padding: '2rem' }}>
            <h1>⚙️ Setup</h1>
            <div>
                <h2>Strava</h2>
                <p>Status: {status.strava ? 'Connected ✅' : 'Disconnected ❌'}</p>
                <button onClick={() => handleAuth('strava')}>Connect Strava</button>
            </div>
            <div>
                <h2>Whoop</h2>
                <p>Status: {status.whoop ? 'Connected ✅' : 'Disconnected ❌'}</p>
                <button onClick={() => handleAuth('whoop')}>Connect Whoop</button>
            </div>
            <div style={{ marginTop: '2rem' }}>
                <button onClick={handleSync} disabled={syncing}>{syncing ? 'Syncing...' : 'Sync Now'}</button>
                <p>{syncMessage}</p>
                <button onClick={checkStatus}>Refresh Status</button>
            </div>
        </div>
    );
}
export default Setup;
