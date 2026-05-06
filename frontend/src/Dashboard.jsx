import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line, Bar, Scatter } from 'react-chartjs-2';
import { Grid, Card, CardContent, Typography, Box, CircularProgress, useTheme } from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

function Dashboard() {
    const [data, setData] = useState({ strava: [], whoop: [] });
    const [insights, setInsights] = useState('Loading insights...');
    const [loading, setLoading] = useState(true);
    const theme = useTheme();

    useEffect(() => {
        Promise.all([
            axios.get('http://localhost:3000/api/data'),
            axios.get('http://localhost:3000/api/insights')
        ]).then(([dataRes, insightsRes]) => {
            setData({
                strava: dataRes.data.strava || [],
                whoop: dataRes.data.whoop || []
            });
            setInsights(insightsRes.data.text);
            setLoading(false);
        }).catch(err => {
            console.error("Failed to load data", err);
            setLoading(false);
            setInsights('Failed to load insights.');
        });
    }, []);

    const { summary, strainRecoveryData, stravaWhoopScatter, baselineFitnessData } = useMemo(() => {
        if (!data.whoop.length && !data.strava.length) return { summary: {}, strainRecoveryData: {}, stravaWhoopScatter: {}, baselineFitnessData: {} };

        // Summaries
        const latestWhoop = data.whoop[0] || {};
        const recentStrava = data.strava.slice(0, 7);
        const totalDistance = recentStrava.reduce((acc, curr) => acc + (curr.distance || 0), 0) / 1000; // in km

        const summary = {
            recovery: latestWhoop.recovery_score || 0,
            strain: latestWhoop.strain || 0,
            distance: totalDistance.toFixed(1)
        };

        // Chart 1: Strain vs Recovery (Mixed Chart)
        const recentWhoop = [...data.whoop].slice(0, 14).reverse(); // Last 14 days, chronological
        const labels = recentWhoop.map(d => d.date);

        const strainRecoveryData = {
            labels,
            datasets: [
                {
                    type: 'line',
                    label: 'Recovery Score',
                    data: recentWhoop.map(d => d.recovery_score),
                    borderColor: theme.palette.success.main,
                    backgroundColor: theme.palette.success.main,
                    borderWidth: 3,
                    tension: 0.4,
                    yAxisID: 'y-recovery',
                },
                {
                    type: 'bar',
                    label: 'Strain',
                    data: recentWhoop.map(d => d.strain),
                    backgroundColor: theme.palette.secondary.main,
                    yAxisID: 'y-strain',
                    borderRadius: 4,
                }
            ]
        };

        // Chart 2: Strava Suffer Score vs Next Day Whoop Recovery
        const scatterData = [];
        data.strava.forEach(activity => {
            if (!activity.start_date || !activity.suffer_score) return;
            const activityDate = activity.start_date.split('T')[0];

            // Find Whoop recovery for the *next* day
            const activityDateObj = new Date(activityDate);
            activityDateObj.setDate(activityDateObj.getDate() + 1);
            const nextDayStr = activityDateObj.toISOString().split('T')[0];

            const nextDayWhoop = data.whoop.find(w => w.date === nextDayStr);
            if (nextDayWhoop && nextDayWhoop.recovery_score) {
                scatterData.push({
                    x: activity.suffer_score,
                    y: nextDayWhoop.recovery_score,
                    r: (activity.distance || 0) / 1000 // Bubble size based on distance
                });
            }
        });

        const stravaWhoopScatter = {
            datasets: [{
                label: 'Suffer Score vs Next-Day Recovery',
                data: scatterData,
                backgroundColor: theme.palette.primary.main + '80', // Add transparency
                borderColor: theme.palette.primary.main,
                pointRadius: 6,
                pointHoverRadius: 8
            }]
        };

        // Chart 3: Fitness Baseline Trends (HRV & RHR)
        const baselineFitnessData = {
            labels,
            datasets: [
                {
                    label: 'HRV',
                    data: recentWhoop.map(d => d.hrv),
                    borderColor: theme.palette.primary.light,
                    backgroundColor: theme.palette.primary.light + '40',
                    fill: true,
                    tension: 0.4,
                    yAxisID: 'y-hrv',
                },
                {
                    label: 'RHR',
                    data: recentWhoop.map(d => d.rhr),
                    borderColor: theme.palette.secondary.light,
                    backgroundColor: theme.palette.secondary.light + '40',
                    fill: true,
                    tension: 0.4,
                    yAxisID: 'y-rhr',
                }
            ]
        };

        return { summary, strainRecoveryData, stravaWhoopScatter, baselineFitnessData };
    }, [data, theme]);


    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h1" gutterBottom sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
                Dashboard
            </Typography>

            {/* KPI Summary Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={4}>
                    <Card sx={{ bgcolor: 'background.paper', height: '100%' }}>
                        <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <FavoriteIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
                            <Typography color="text.secondary" variant="subtitle1">Latest Recovery</Typography>
                            <Typography variant="h3" color="success.main">{summary.recovery || '--'}%</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Card sx={{ bgcolor: 'background.paper', height: '100%' }}>
                        <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <FlashOnIcon color="secondary" sx={{ fontSize: 40, mb: 1 }} />
                            <Typography color="text.secondary" variant="subtitle1">Latest Strain</Typography>
                            <Typography variant="h3" color="secondary.main">{summary.strain?.toFixed(1) || '--'}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Card sx={{ bgcolor: 'background.paper', height: '100%' }}>
                        <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <DirectionsRunIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                            <Typography color="text.secondary" variant="subtitle1">Recent Distance (7d)</Typography>
                            <Typography variant="h3" color="primary.main">{summary.distance || '--'} km</Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* AI Insights Card */}
            <Card sx={{ mb: 4, bgcolor: theme.palette.mode === 'dark' ? '#0d233a' : '#e3f2fd', backgroundImage: 'none' }}>
                <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <AutoAwesomeIcon color="primary" sx={{ mr: 1 }} />
                        <Typography variant="h5" color="text.primary" sx={{ fontWeight: 'bold' }}>AI Insights</Typography>
                    </Box>
                    <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                        {insights}
                    </Typography>
                </CardContent>
            </Card>

            {/* Charts Section */}
            <Grid container spacing={3}>
                {/* Chart 1 */}
                <Grid item xs={12} lg={6}>
                    <Card sx={{ height: '100%' }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>Strain vs Recovery (Last 14 Days)</Typography>
                            <Box sx={{ height: 300 }}>
                                {strainRecoveryData.labels?.length > 0 ? (
                                    <Bar
                                        data={strainRecoveryData}
                                        options={{
                                            responsive: true,
                                            maintainAspectRatio: false,
                                            scales: {
                                                'y-recovery': { type: 'linear', position: 'left', min: 0, max: 100, title: { display: true, text: 'Recovery %' } },
                                                'y-strain': { type: 'linear', position: 'right', min: 0, max: 21, title: { display: true, text: 'Strain' }, grid: { drawOnChartArea: false } }
                                            }
                                        }}
                                    />
                                ) : <Typography color="text.secondary">Not enough data.</Typography>}
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Chart 2 */}
                <Grid item xs={12} lg={6}>
                    <Card sx={{ height: '100%' }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>Strava Suffer Score vs Next-Day Recovery</Typography>
                            <Box sx={{ height: 300 }}>
                                {stravaWhoopScatter.datasets && stravaWhoopScatter.datasets[0]?.data.length > 0 ? (
                                    <Scatter
                                        data={stravaWhoopScatter}
                                        options={{
                                            responsive: true,
                                            maintainAspectRatio: false,
                                            scales: {
                                                x: { title: { display: true, text: 'Strava Suffer Score' } },
                                                y: { title: { display: true, text: 'Next-Day Recovery %' } }
                                            }
                                        }}
                                    />
                                ) : <Typography color="text.secondary">Not enough overlapping data.</Typography>}
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Chart 3 */}
                <Grid item xs={12}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>Baseline Fitness Trends (HRV & RHR)</Typography>
                            <Box sx={{ height: 300 }}>
                                {baselineFitnessData.labels?.length > 0 ? (
                                    <Line
                                        data={baselineFitnessData}
                                        options={{
                                            responsive: true,
                                            maintainAspectRatio: false,
                                            scales: {
                                                'y-hrv': { type: 'linear', position: 'left', title: { display: true, text: 'HRV (ms)' } },
                                                'y-rhr': { type: 'linear', position: 'right', title: { display: true, text: 'RHR (bpm)' }, grid: { drawOnChartArea: false } }
                                            }
                                        }}
                                    />
                                ) : <Typography color="text.secondary">Not enough data.</Typography>}
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
}
export default Dashboard;
