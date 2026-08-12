import React, { useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, Grid, Header, Table } from 'semantic-ui-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { API } from '../../helpers';
import { UserContext } from '../../context/User';
import './Dashboard.css';

// Custom chart configuration
const chartConfig = {
  lineChart: {
    style: {
      background: '#fff',
      borderRadius: '8px',
    },
    line: {
      strokeWidth: 2,
      dot: false,
      activeDot: { r: 4 },
    },
    grid: {
      vertical: false,
      horizontal: true,
      opacity: 0.1,
    },
  },
  colors: {
    requests: '#4318FF',
    quota: '#00B5D8',
    tokens: '#6C63FF',
  },
  barColors: [
    '#4318FF', '#00B5D8', '#6C63FF', '#05CD99', '#FFB547',
    '#FF5E7D', '#41B883', '#7983FF', '#FF8F6B', '#49BEFF',
  ],
};

const Dashboard = () => {
  const { t } = useTranslation();
  const [userState] = useContext(UserContext);
  const userRole = userState?.user?.role || 0;
  const isAdmin = userRole >= 10;

  const [byModel, setByModel] = useState([]);
  const [byChannel, setByChannel] = useState([]);
  const [byToken, setByToken] = useState([]);
  const [totalConsumption, setTotalConsumption] = useState([]);
  const [perUserChannel, setPerUserChannel] = useState([]);
  const [perUserConsumption, setPerUserConsumption] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summaryData, setSummaryData] = useState({
    todayRequests: 0,
    todayQuota: 0,
    todayTokens: 0,
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await API.get('/api/user/dashboard');
      if (response.data.success) {
        const d = response.data.data;
        setByModel(d.by_model || []);
        setByChannel(d.by_channel || []);
        setByToken(d.by_token || []);
        setTotalConsumption(d.total_consumption || []);
        setPerUserChannel(d.per_user_channel || []);
        setPerUserConsumption(d.per_user_consumption || []);
        // Use by_model for summary calculation (same Day+ModelName structure as before)
        calculateSummary(d.by_model || []);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setByModel([]);
      setByChannel([]);
      setByToken([]);
      setTotalConsumption([]);
      setPerUserChannel([]);
      setPerUserConsumption([]);
      calculateSummary([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateSummary = (dashboardData) => {
    if (!Array.isArray(dashboardData) || dashboardData.length === 0) {
      setSummaryData({ todayRequests: 0, todayQuota: 0, todayTokens: 0 });
      return;
    }
    const today = new Date().toISOString().split('T')[0];
    const todayData = dashboardData.filter((item) => item.Day === today);
    setSummaryData({
      todayRequests: todayData.reduce((sum, item) => sum + item.RequestCount, 0),
      todayQuota: todayData.reduce((sum, item) => sum + item.Quota, 0) / 1000000,
      todayTokens: todayData.reduce((sum, item) => sum + item.PromptTokens + item.CompletionTokens, 0),
    });
  };

  // Format date for X-axis
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' });
  };

  const xAxisConfig = {
    dataKey: 'date',
    axisLine: false,
    tickLine: false,
    tick: { fontSize: 12, fill: '#A3AED0', textAnchor: 'middle' },
    tickFormatter: formatDate,
    interval: 0,
    minTickGap: 5,
    padding: { left: 30, right: 30 },
  };

  // Generic: process data grouped by a key into time series for line charts
  // data: [{Day, <groupKey>, Quota, RequestCount, PromptTokens, CompletionTokens}, ...]
  // groupKey: e.g. 'ModelName', 'ChannelId', 'TokenName'
  // valueField: 'Quota' (default) | 'RequestCount' | 'tokens'
  const processGroupedTimeSeries = (data, groupKey, valueField = 'Quota') => {
    if (!Array.isArray(data) || data.length === 0) return [];

    const timeData = {};
    const dates = data.map((item) => item.Day);
    const maxDate = new Date();
    let minDate = dates.length > 0 ? new Date(Math.min(...dates.map((d) => new Date(d)))) : new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    if (minDate > sevenDaysAgo) minDate = sevenDaysAgo;

    // Generate all dates
    for (let d = new Date(minDate); d <= maxDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      timeData[dateStr] = { date: dateStr };
    }

    // Get unique groups
    const groups = [...new Set(data.map((item) => item[groupKey]))];

    // Initialize all groups to 0 for each date
    Object.keys(timeData).forEach((date) => {
      groups.forEach((g) => { timeData[date][String(g)] = 0; });
    });

    // Fill actual data
    data.forEach((item) => {
      if (!timeData[item.Day]) return;
      const groupVal = String(item[groupKey]);
      let val = 0;
      if (valueField === 'tokens') {
        val = item.PromptTokens + item.CompletionTokens;
      } else if (valueField === 'Quota') {
        val = item.Quota / 1000000;
      } else {
        val = item[valueField] || 0;
      }
      timeData[item.Day][groupVal] = (timeData[item.Day][groupVal] || 0) + val;
    });

    const result = Object.values(timeData).sort((a, b) => a.date.localeCompare(b.date));
    return { data: result, groups };
  };

  // Process total consumption (simple day-level aggregation, no grouping)
  const processTotalTimeSeries = (data) => {
    if (!Array.isArray(data) || data.length === 0) return [];
    return data.map((item) => ({
      date: item.Day,
      requests: item.RequestCount,
      quota: item.Quota / 1000000,
      tokens: item.PromptTokens + item.CompletionTokens,
    }));
  };

  // Process stacked bar chart (by model, tokens)
  const processModelBarData = () => {
    const data = byModel;
    if (!Array.isArray(data) || data.length === 0) return { data: [], models: [] };

    const timeData = {};
    const dates = data.map((item) => item.Day);
    const maxDate = new Date();
    let minDate = dates.length > 0 ? new Date(Math.min(...dates.map((d) => new Date(d)))) : new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    if (minDate > sevenDaysAgo) minDate = sevenDaysAgo;

    for (let d = new Date(minDate); d <= maxDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      timeData[dateStr] = { date: dateStr };
    }

    const models = [...new Set(data.map((item) => item.ModelName))];
    Object.keys(timeData).forEach((date) => {
      models.forEach((m) => { timeData[date][m] = 0; });
    });

    data.forEach((item) => {
      if (!timeData[item.Day]) return;
      timeData[item.Day][item.ModelName] = (timeData[item.Day][item.ModelName] || 0) + item.PromptTokens + item.CompletionTokens;
    });

    return {
      data: Object.values(timeData).sort((a, b) => a.date.localeCompare(b.date)),
      models,
    };
  };

  const getBarColor = (index) => chartConfig.barColors[index % chartConfig.barColors.length];

  // Prepare chart data
  const modelTrend = processGroupedTimeSeries(byModel, 'ModelName', 'Quota');
  const channelTrend = processGroupedTimeSeries(byChannel, 'ChannelId', 'Quota');
  const tokenTrend = processGroupedTimeSeries(byToken, 'TokenName', 'Quota');
  const totalTrend = processTotalTimeSeries(totalConsumption);
  const barChartData = processModelBarData();

  // --- Render helpers ---

  const renderTrendChart = (title, trendData, valueFormatter, valueName) => {
    if (!trendData || !trendData.data || trendData.data.length === 0) {
      return (
        <Card fluid className='chart-card'>
          <Card.Content>
            <Card.Header>{title}</Card.Header>
            <div className='chart-container' style={{ textAlign: 'center', padding: '40px', color: '#A3AED0' }}>
              {t('dashboard.no_data')}
            </div>
          </Card.Content>
        </Card>
      );
    }
    return (
      <Card fluid className='chart-card'>
        <Card.Content>
          <Card.Header>{title}</Card.Header>
          <div className='chart-container'>
            <ResponsiveContainer width='100%' height={120} margin={{ left: 10, right: 10 }}>
              <LineChart data={trendData.data}>
                <CartesianGrid strokeDasharray='3 3' vertical={chartConfig.lineChart.grid.vertical}
                  horizontal={chartConfig.lineChart.grid.horizontal} opacity={chartConfig.lineChart.grid.opacity} />
                <XAxis {...xAxisConfig} />
                <YAxis hide={true} />
                <Tooltip
                  contentStyle={{ background: '#fff', border: 'none', borderRadius: '4px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                  formatter={(value) => [valueFormatter ? valueFormatter(value) : value, valueName || '']}
                  labelFormatter={(label) => `${t('dashboard.statistics.tooltip.date')}: ${formatDate(label)}`}
                />
                <Legend />
                {trendData.groups.map((group, index) => (
                  <Line key={group} type='monotone' dataKey={String(group)} stroke={chartConfig.barColors[index % chartConfig.barColors.length]}
                    strokeWidth={chartConfig.lineChart.line.strokeWidth}
                    dot={chartConfig.lineChart.line.dot}
                    activeDot={chartConfig.lineChart.line.activeDot}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card.Content>
      </Card>
    );
  };

  const renderTotalChart = (title) => {
    if (!totalTrend || totalTrend.length === 0) {
      return (
        <Card fluid className='chart-card'>
          <Card.Content>
            <Card.Header>{title}</Card.Header>
            <div className='chart-container' style={{ textAlign: 'center', padding: '40px', color: '#A3AED0' }}>
              {t('dashboard.no_data')}
            </div>
          </Card.Content>
        </Card>
      );
    }
    return (
      <Card fluid className='chart-card'>
        <Card.Content>
          <Card.Header>{title}</Card.Header>
          <div className='chart-container'>
            <ResponsiveContainer width='100%' height={120} margin={{ left: 10, right: 10 }}>
              <LineChart data={totalTrend}>
                <CartesianGrid strokeDasharray='3 3' vertical={false} horizontal={true} opacity={0.1} />
                <XAxis {...xAxisConfig} />
                <YAxis hide={true} />
                <Tooltip
                  contentStyle={{ background: '#fff', border: 'none', borderRadius: '4px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                  formatter={(value) => [value.toFixed ? value.toFixed(2) : value, t('dashboard.charts.quota.tooltip')]}
                  labelFormatter={(label) => `${t('dashboard.statistics.tooltip.date')}: ${formatDate(label)}`}
                />
                <Line type='monotone' dataKey='quota' stroke={chartConfig.colors.quota}
                  strokeWidth={chartConfig.lineChart.line.strokeWidth}
                  dot={chartConfig.lineChart.line.dot}
                  activeDot={chartConfig.lineChart.line.activeDot}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card.Content>
      </Card>
    );
  };

  // Per-user analysis tables (admin only)
  const renderPerUserAnalysis = () => {
    if (!isAdmin) return null;

    const channelColumns = [
      { key: 'Username', label: t('dashboard.per_user.username') },
      { key: 'ChannelId', label: t('dashboard.per_user.channel_id') },
      { key: 'RequestCount', label: t('dashboard.per_user.requests') },
      { key: 'Quota', label: t('dashboard.per_user.quota'), format: (v) => (v / 1000000).toFixed(2) },
      { key: 'Tokens', label: t('dashboard.per_user.tokens'), format: (v, row) => row.PromptTokens + row.CompletionTokens },
    ];

    const consumptionColumns = [
      { key: 'Username', label: t('dashboard.per_user.username') },
      { key: 'RequestCount', label: t('dashboard.per_user.requests') },
      { key: 'Quota', label: t('dashboard.per_user.quota'), format: (v) => (v / 1000000).toFixed(2) },
      { key: 'Tokens', label: t('dashboard.per_user.tokens'), format: (v, row) => row.PromptTokens + row.CompletionTokens },
    ];

    return (
      <Grid columns={2} stackable>
        <Grid.Column>
          <Card fluid className='chart-card'>
            <Card.Content>
              <Card.Header>{t('dashboard.per_user.channel_title')}</Card.Header>
              <div className='chart-container' style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {perUserChannel.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#A3AED0' }}>{t('dashboard.no_data')}</div>
                ) : (
                  <Table celled compact size='small'>
                    <Table.Header>
                      <Table.Row>
                        {channelColumns.map((col) => (
                          <Table.HeaderCell key={col.key}>{col.label}</Table.HeaderCell>
                        ))}
                      </Table.Row>
                    </Table.Header>
                    <Table.Body>
                      {perUserChannel.map((row, idx) => (
                        <Table.Row key={idx}>
                          {channelColumns.map((col) => (
                            <Table.Cell key={col.key}>
                              {col.format ? col.format(row[col.key], row) : row[col.key]}
                            </Table.Cell>
                          ))}
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table>
                )}
              </div>
            </Card.Content>
          </Card>
        </Grid.Column>
        <Grid.Column>
          <Card fluid className='chart-card'>
            <Card.Content>
              <Card.Header>{t('dashboard.per_user.consumption_title')}</Card.Header>
              <div className='chart-container' style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {perUserConsumption.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#A3AED0' }}>{t('dashboard.no_data')}</div>
                ) : (
                  <Table celled compact size='small'>
                    <Table.Header>
                      <Table.Row>
                        {consumptionColumns.map((col) => (
                          <Table.HeaderCell key={col.key}>{col.label}</Table.HeaderCell>
                        ))}
                      </Table.Row>
                    </Table.Header>
                    <Table.Body>
                      {perUserConsumption.map((row, idx) => (
                        <Table.Row key={idx}>
                          {consumptionColumns.map((col) => (
                            <Table.Cell key={col.key}>
                              {col.format ? col.format(row[col.key], row) : row[col.key]}
                            </Table.Cell>
                          ))}
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table>
                )}
              </div>
            </Card.Content>
          </Card>
        </Grid.Column>
      </Grid>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className='dashboard-container'>
        <div style={{ textAlign: 'center', padding: '60px', color: '#A3AED0' }}>
          <i className='spinner loading icon' style={{ fontSize: '2em' }}></i>
          <p>{t('dashboard.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className='dashboard-container'>
      {/* Three trend charts in a row */}
      <Grid columns={3} stackable className='charts-grid'>
        <Grid.Column>
          {renderTrendChart(t('dashboard.charts.model_trend'), modelTrend, (v) => v.toFixed(2), t('dashboard.charts.quota.tooltip'))}
        </Grid.Column>
        <Grid.Column>
          {isAdmin
            ? renderTrendChart(t('dashboard.charts.token_trend'), tokenTrend, (v) => v.toFixed(2), t('dashboard.charts.quota.tooltip'))
            : renderTrendChart(t('dashboard.charts.channel_trend'), channelTrend, (v) => v.toFixed(2), t('dashboard.charts.quota.tooltip'))
          }
        </Grid.Column>
        <Grid.Column>
          {renderTotalChart(isAdmin ? t('dashboard.charts.all_user_total') : t('dashboard.charts.total_consumption'))}
        </Grid.Column>
      </Grid>

      {/* Admin: Per-user analysis section */}
      {isAdmin && (
        <>
          <Header as='h3' style={{ marginTop: '24px', color: '#2B3674' }}>
            {t('dashboard.per_user.section_title')}
          </Header>
          {renderPerUserAnalysis()}
        </>
      )}

      {/* Bottom: Stacked bar chart (statistics unchanged) */}
      <Card fluid className='chart-card'>
        <Card.Content>
          <Card.Header>{t('dashboard.statistics.title')}</Card.Header>
          <div className='chart-container'>
            <ResponsiveContainer width='100%' height={300}>
              <BarChart data={barChartData.data}>
                <CartesianGrid strokeDasharray='3 3' vertical={false} opacity={0.1} />
                <XAxis {...xAxisConfig} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#A3AED0' }} />
                <Tooltip
                  contentStyle={{ background: '#fff', border: 'none', borderRadius: '4px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                  labelFormatter={(label) => `${t('dashboard.statistics.tooltip.date')}: ${formatDate(label)}`}
                />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                {barChartData.models.map((model, index) => (
                  <Bar key={model} dataKey={model} stackId='a' fill={getBarColor(index)} name={model} radius={[4, 4, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card.Content>
      </Card>
    </div>
  );
};

export default Dashboard;
