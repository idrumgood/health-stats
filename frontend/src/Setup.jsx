import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Box, Typography, Button, Card, CardContent, Grid, CircularProgress, Chip } from '@mui/material';
import SyncIcon from '@mui/icons-material/Sync';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

function Setup() {
    const [status, setStatus] = useState({ strava: false, whoop: false });
    const [syncing, setSyncing] = useState(false);
    const [syncMessage, setSyncMessage] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => { checkStatus(); }, []);

    const checkStatus = async () => {
        setLoading(true);
        try {
            const res = await axios.get('http://localhost:3000/api/auth/status');
            setStatus(res.data);
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    const handleAuth = async (service) => {
        try {
            const res = await axios.get(`http://localhost:3000/api/auth/${service}`);
            window.open(res.data.url, '_blank');
        } catch (e) {
            console.error(e);
        }
    };

    const handleSync = async () => {
        setSyncing(true); setSyncMessage('Syncing data from services...');
        try {
            const res = await axios.post('http://localhost:3000/api/sync');
            setSyncMessage(`Sync complete!`);
        } catch { setSyncMessage('Sync failed. Please check backend logs.'); }
        setSyncing(false);
    };

    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
    }

    return (
        <Box sx={{ flexGrow: 1, maxWidth: 800, mx: 'auto' }}>
            <Typography variant="h1" gutterBottom sx={{ mb: 4 }}>
                Integrations Setup
            </Typography>

            <Grid container spacing={4}>
                <Grid item xs={12} md={6}>
                    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', p: 2 }}>
                        <CardContent sx={{ textAlign: 'center', flexGrow: 1, width: '100%' }}>
                            <Typography variant="h4" gutterBottom>Strava</Typography>
                            <Box sx={{ mb: 3 }}>
                                {status.strava ? (
                                    <Chip icon={<CheckCircleIcon />} label="Connected" color="success" variant="outlined" />
                                ) : (
                                    <Chip icon={<CancelIcon />} label="Disconnected" color="error" variant="outlined" />
                                )}
                            </Box>
                            <Button
                                variant={status.strava ? "outlined" : "contained"}
                                color="primary"
                                onClick={() => handleAuth('strava')}
                                fullWidth
                            >
                                {status.strava ? 'Reconnect Strava' : 'Connect Strava'}
                            </Button>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', p: 2 }}>
                        <CardContent sx={{ textAlign: 'center', flexGrow: 1, width: '100%' }}>
                            <Typography variant="h4" gutterBottom>Whoop</Typography>
                            <Box sx={{ mb: 3 }}>
                                {status.whoop ? (
                                    <Chip icon={<CheckCircleIcon />} label="Connected" color="success" variant="outlined" />
                                ) : (
                                    <Chip icon={<CancelIcon />} label="Disconnected" color="error" variant="outlined" />
                                )}
                            </Box>
                            <Button
                                variant={status.whoop ? "outlined" : "contained"}
                                color="primary"
                                onClick={() => handleAuth('whoop')}
                                fullWidth
                            >
                                {status.whoop ? 'Reconnect Whoop' : 'Connect Whoop'}
                            </Button>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <Box sx={{ mt: 6, p: 4, bgcolor: 'background.paper', borderRadius: 2, textAlign: 'center', boxShadow: 1 }}>
                <Typography variant="h5" gutterBottom>Data Synchronization</Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                    Pull the latest data from connected services into your local database.
                </Typography>

                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Button
                        variant="contained"
                        color="secondary"
                        size="large"
                        startIcon={syncing ? <CircularProgress size={20} color="inherit" /> : <SyncIcon />}
                        onClick={handleSync}
                        disabled={syncing || (!status.strava && !status.whoop)}
                    >
                        {syncing ? 'Syncing...' : 'Sync Now'}
                    </Button>
                    <Button variant="outlined" onClick={checkStatus}>
                        Refresh Status
                    </Button>
                </Box>
                {syncMessage && (
                    <Typography variant="body2" sx={{ mt: 2, color: syncing ? 'text.secondary' : 'success.main' }}>
                        {syncMessage}
                    </Typography>
                )}
            </Box>
        </Box>
    );
}
export default Setup;
