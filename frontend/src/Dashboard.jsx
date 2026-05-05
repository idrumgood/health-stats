import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

function Dashboard() {
    const [data, setData] = useState({ strava: [], whoop: [] });
    const [insights, setInsights] = useState('Loading insights...');

    useEffect(() => {
        axios.get('http://localhost:3000/api/data').then(res => setData(res.data));
        axios.get('http://localhost:3000/api/insights').then(res => setInsights(res.data.text));
    }, []);

    const whoopChartData = {
        labels: data.whoop.slice(0,14).map(d => d.date),
        datasets: [
            { label: 'Strain', data: data.whoop.slice(0,14).map(d => d.strain), borderColor: 'red' },
            { label: 'Recovery', data: data.whoop.slice(0,14).map(d => d.recovery_score), borderColor: 'blue' }
        ]
    };

    return (
        <div style={{ padding: '2rem' }}>
            <h1>📊 Dashboard</h1>
            <div style={{ padding: '1rem', background: '#e0f2fe', marginBottom: '2rem' }}>
                <h3>🤖 AI Insights</h3>
                <p>{insights}</p>
            </div>
            <div style={{ height: '400px' }}>
                 <Line data={whoopChartData} />
            </div>
        </div>
    );
}
export default Dashboard;
