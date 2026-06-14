import { useState, useEffect } from 'react';
import { FileText, Calendar, TrendingUp, TrendingDown, CheckCircle, AlertTriangle, Activity, Sparkles, Heart } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

// API 基础地址
const API_BASE = 'https://final-production-4362.up.railway.app/api';

interface HealthReport {
    id: number;
    report_type: string;
    report_date: string;
    title: string;
    summary: string;
    good_points: string[];
    improvement_points: string[];
    health_risks: string[];
    metrics_data: any;
}

// 根据数据生成详细的分析内容（前端处理中英文）
function generateDetailedContent(metrics: any, isZh: boolean) {
    const goodPoints: string[] = [];
    const improvementPoints: string[] = [];
    const healthRisks: string[] = [];
    
    const avgSteps = metrics.avgSteps;
    const avgSleep = metrics.avgSleep;
    const avgBmi = metrics.avgBmi;
    const avgWeight = metrics.avgWeight;
    const weightChange = metrics.weightChange;
    const recordCount = metrics.recordCount || 0;
    
    // ========== 步数分析 ==========
    if (avgSteps) {
        if (avgSteps >= 10000) {
            goodPoints.push(isZh ? `日均步数${avgSteps}步，运动量非常充足！这对心血管健康和体重管理非常有益。` : `Daily steps: ${avgSteps}, excellent exercise volume! Great for cardiovascular health.`);
        } else if (avgSteps >= 8000) {
            goodPoints.push(isZh ? `日均步数${avgSteps}步，运动量达标，继续保持！` : `Daily steps: ${avgSteps}, meets recommendations, keep it up!`);
        } else if (avgSteps >= 5000) {
            improvementPoints.push(isZh ? `日均步数${avgSteps}步，低于推荐值(8000步)。建议每天多走路、爬楼梯或进行其他有氧运动。` : `Daily steps: ${avgSteps}, below recommended (8000). Walk more, take stairs, or do other aerobic exercises.`);
            healthRisks.push(isZh ? `长期运动不足可能导致：肥胖、高血压、心血管疾病、糖尿病、骨质疏松等慢性病。` : `Chronic inactivity may lead to: obesity, hypertension, cardiovascular disease, diabetes, osteoporosis.`);
        } else {
            improvementPoints.push(isZh ? `日均步数仅${avgSteps}步，运动量严重不足！请立即开始增加日常活动。` : `Only ${avgSteps} steps/day, severely insufficient! Start increasing activity immediately.`);
            healthRisks.push(isZh ? `⚠️ 严重缺乏运动是多种慢性病的主要风险因素：心脏病、中风、2型糖尿病、代谢综合征、某些癌症。` : `⚠️ Severe lack of exercise is a major risk factor for: heart disease, stroke, type 2 diabetes, metabolic syndrome, certain cancers.`);
        }
    }
    
    // ========== 睡眠分析 ==========
    if (avgSleep) {
        if (avgSleep >= 85) {
            goodPoints.push(isZh ? `睡眠质量优秀（${avgSleep}分），良好的睡眠有助于身体修复和免疫力提升。` : `Excellent sleep quality (${avgSleep} points), good for recovery and immunity.`);
        } else if (avgSleep >= 70) {
            goodPoints.push(isZh ? `睡眠质量良好（${avgSleep}分），保持规律作息。` : `Good sleep quality (${avgSleep} points), maintain regular schedule.`);
        } else if (avgSleep >= 60) {
            improvementPoints.push(isZh ? `睡眠评分${avgSleep}分，处于边缘水平。建议：固定睡眠时间、睡前1小时远离电子设备、保持卧室安静。` : `Sleep score ${avgSleep}, borderline. Suggestions: fixed sleep time, no screens 1hr before bed, keep bedroom quiet.`);
            healthRisks.push(isZh ? `长期睡眠不佳可能导致：免疫力下降、记忆力减退、情绪波动、焦虑抑郁、工作效率降低。` : `Poor sleep may lead to: weakened immunity, memory loss, mood swings, anxiety/depression, reduced work efficiency.`);
        } else {
            improvementPoints.push(isZh ? `睡眠评分${avgSleep}分，睡眠质量差！这是严重的健康警报。` : `Sleep score ${avgSleep}, poor sleep quality! This is a serious health alert.`);
            healthRisks.push(isZh ? `⚠️ 长期严重睡眠不足显著增加：高血压、心脏病、糖尿病、肥胖、抑郁症、免疫功能紊乱风险。` : `⚠️ Chronic severe sleep deprivation significantly increases risk of: hypertension, heart disease, diabetes, obesity, depression, immune dysfunction.`);
        }
    }
    
    // ========== BMI分析 ==========
    if (avgBmi) {
        if (avgBmi >= 18.5 && avgBmi <= 24) {
            goodPoints.push(isZh ? `BMI ${avgBmi}，处于理想范围，体重管理良好。` : `BMI ${avgBmi}, in ideal range, good weight management.`);
        } else if (avgBmi > 24 && avgBmi <= 28) {
            improvementPoints.push(isZh ? `BMI ${avgBmi}，属于超重范围。建议：控制碳水化合物和油脂摄入，增加有氧运动。` : `BMI ${avgBmi}, overweight range. Suggestions: control carbs and fat intake, increase aerobic exercise.`);
            healthRisks.push(isZh ? `超重会增加以下风险：高血压、高血脂、2型糖尿病、睡眠呼吸暂停、关节疼痛、脂肪肝。` : `Overweight increases risk of: hypertension, high cholesterol, type 2 diabetes, sleep apnea, joint pain, fatty liver.`);
        } else if (avgBmi > 28) {
            improvementPoints.push(isZh ? `BMI ${avgBmi}，属于肥胖范围！请立即重视体重管理，建议咨询医生或营养师。` : `BMI ${avgBmi}, obese range! Please take weight management seriously, consult a doctor or nutritionist.`);
            healthRisks.push(isZh ? `⚠️ 肥胖是多种严重疾病的主要风险因素：心脏病、中风、2型糖尿病、高血压、高胆固醇、睡眠呼吸暂停、骨关节炎、某些癌症。` : `⚠️ Obesity is a major risk factor for: heart disease, stroke, type 2 diabetes, hypertension, high cholesterol, sleep apnea, osteoarthritis, certain cancers.`);
        } else if (avgBmi < 18.5) {
            improvementPoints.push(isZh ? `BMI ${avgBmi}，属于偏瘦范围。建议：增加优质蛋白摄入，适当力量训练增肌。` : `BMI ${avgBmi}, underweight range. Suggestions: increase quality protein intake, strength training to build muscle.`);
            healthRisks.push(isZh ? `体重过轻可能导致：免疫力下降、骨质疏松、贫血、疲劳乏力、内分泌紊乱、月经不调。` : `Underweight may lead to: weakened immunity, osteoporosis, anemia, fatigue, endocrine disorders, irregular menstruation.`);
        }
    }
    
    // ========== 体重变化分析 ==========
    if (weightChange && Math.abs(parseFloat(weightChange)) > 1) {
        if (parseFloat(weightChange) > 2) {
            improvementPoints.push(isZh ? `体重上升${weightChange}kg，变化较快。建议记录饮食、控制热量摄入。` : `Weight increased by ${weightChange}kg, rapid change. Track diet, control calorie intake.`);
            healthRisks.push(isZh ? `体重快速增加可能导致：代谢紊乱、胰岛素抵抗、脂肪肝、心血管负担加重。` : `Rapid weight gain may lead to: metabolic disorder, insulin resistance, fatty liver, increased cardiovascular burden.`);
        } else if (parseFloat(weightChange) < -2) {
            improvementPoints.push(isZh ? `体重下降${Math.abs(parseFloat(weightChange))}kg，变化较快。请确保营养充足。` : `Weight decreased by ${Math.abs(parseFloat(weightChange))}kg, rapid change. Ensure adequate nutrition.`);
            healthRisks.push(isZh ? `体重快速下降可能导致：营养不良、肌肉流失、免疫力下降、电解质紊乱。` : `Rapid weight loss may lead to: malnutrition, muscle loss, weakened immunity, electrolyte imbalance.`);
        }
    }
    
    // 数据量提醒
    if (recordCount < 7 && recordCount > 0) {
        improvementPoints.push(isZh ? `本周期仅记录${recordCount}天数据。建议每周至少记录5-7天，以获得更准确的分析。` : `Only ${recordCount} days recorded this period. Aim for 5-7 days per week for more accurate analysis.`);
    }
    
    return { goodPoints, improvementPoints, healthRisks };
}

export function HealthSummary({ user }: any) {
    const { language, formatDate } = useLanguage();
    const isZh = language === 'zh';
    const [reports, setReports] = useState<HealthReport[]>([]);
    const [selectedReport, setSelectedReport] = useState<HealthReport | null>(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    
    const token = localStorage.getItem('token');
    
    // 翻译报告标题（周报/月报/年报）
    const translateTitle = (report: HealthReport): string => {
        if (isZh) return report.title;
        
        const date = new Date(report.report_date);
        const year = date.getFullYear();
        
        if (report.report_type === 'week') {
            // 从中文标题提取周数，例如 "2026年第24周" -> 24
            const weekMatch = report.title.match(/第(\d+)周/);
            const weekNum = weekMatch ? weekMatch[1] : '';
            return `Week ${weekNum}, ${year}`;
        } else if (report.report_type === 'month') {
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const month = date.getMonth();
            return `${monthNames[month]} ${year}`;
        } else if (report.report_type === 'year') {
            return `${year}`;
        }
        
        return report.title;
    };
    
    const loadReports = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE}/health-summary`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setReports(data);
            }
        } catch (error) {
            console.error('加载报告失败:', error);
        } finally {
            setLoading(false);
        }
    };
    
    const generateAllReports = async () => {
        setGenerating(true);
        try {
            const response = await fetch(`${API_BASE}/health-summary/generate-all`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ language: isZh ? 'zh' : 'en' })
            });
            if (response.ok) {
                const result = await response.json();
                alert(isZh ? `生成完成！周报${result.results.week}份，月报${result.results.month}份，年报${result.results.year}份` : `Generated! Weekly: ${result.results.week}, Monthly: ${result.results.month}, Annual: ${result.results.year}`);
                loadReports();
            }
        } catch (error) {
            console.error('生成失败:', error);
            alert(isZh ? '生成失败' : 'Generation failed');
        } finally {
            setGenerating(false);
        }
    };
    
    useEffect(() => {
        loadReports();
    }, []);
    
    const viewReport = async (id: number) => {
        try {
            const response = await fetch(`${API_BASE}/health-summary/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                // 生成详细分析内容
                const detailed = generateDetailedContent(data.metrics_data || {}, isZh);
                setSelectedReport({
                    ...data,
                    good_points: detailed.goodPoints,
                    improvement_points: detailed.improvementPoints,
                    health_risks: detailed.healthRisks
                });
            }
        } catch (error) {
            console.error('加载详情失败:', error);
        }
    };
    
    const getTypeName = (type: string) => {
        if (type === 'week') return isZh ? '周报' : 'Weekly';
        if (type === 'month') return isZh ? '月报' : 'Monthly';
        return isZh ? '年报' : 'Annual';
    };
    
    const getTypeColor = (type: string) => {
        if (type === 'week') return 'bg-indigo-100 text-indigo-700';
        if (type === 'month') return 'bg-green-100 text-green-700';
        return 'bg-purple-100 text-purple-700';
    };
    
    const weeklyReports = reports.filter(r => r.report_type === 'week');
    const monthlyReports = reports.filter(r => r.report_type === 'month');
    const yearlyReports = reports.filter(r => r.report_type === 'year');
    
    if (loading) {
        return <div className="max-w-6xl mx-auto p-6 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;
    }
    
    return (
        <div className="max-w-6xl mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold">{isZh ? '健康总结报告' : 'Health Summary Report'}</h1>
                    <p className="text-gray-500">{isZh ? '根据您的历史数据自动生成' : 'Auto-generated from your health data'}</p>
                </div>
                <button onClick={generateAllReports} disabled={generating} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2">
                    <Sparkles size={18} />
                    {generating ? (isZh ? '生成中...' : 'Generating...') : (isZh ? '一键生成全部报告' : 'Generate All Reports')}
                </button>
            </div>
            
            {reports.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <FileText className="mx-auto text-gray-400 mb-3" size={48} />
                    <p className="text-gray-500">{isZh ? '暂无报告' : 'No reports yet'}</p>
                    <button onClick={generateAllReports} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg">
                        {isZh ? '点击生成报告' : 'Click to generate'}
                    </button>
                </div>
            ) : (
                <>
                    {/* 周报 */}
                    {weeklyReports.length > 0 && (
                        <div className="mb-8">
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Calendar size={20} className="text-indigo-500" />{isZh ? '周报' : 'Weekly Reports'}</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {weeklyReports.map(r => (
                                    <div key={r.id} onClick={() => viewReport(r.id)} className="bg-white rounded-xl shadow-md p-4 cursor-pointer hover:shadow-lg">
                                        <div className="flex justify-between">
                                            <div>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className={`px-2 py-1 text-xs rounded-full ${getTypeColor(r.report_type)}`}>{getTypeName(r.report_type)}</span>
                                                    <h3 className="font-semibold">{translateTitle(r)}</h3>
                                                </div>
                                                <p className="text-sm text-gray-600">{r.summary}</p>
                                                <p className="text-xs text-gray-400 mt-2">{new Date(r.report_date).toLocaleDateString()}</p>
                                            </div>
                                            <FileText size={20} className="text-gray-400" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {/* 月报 */}
                    {monthlyReports.length > 0 && (
                        <div className="mb-8">
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Calendar size={20} className="text-green-500" />{isZh ? '月报' : 'Monthly Reports'}</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {monthlyReports.map(r => (
                                    <div key={r.id} onClick={() => viewReport(r.id)} className="bg-white rounded-xl shadow-md p-4 cursor-pointer hover:shadow-lg">
                                        <div className="flex justify-between">
                                            <div>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className={`px-2 py-1 text-xs rounded-full ${getTypeColor(r.report_type)}`}>{getTypeName(r.report_type)}</span>
                                                    <h3 className="font-semibold">{translateTitle(r)}</h3>
                                                </div>
                                                <p className="text-sm text-gray-600">{r.summary}</p>
                                                <p className="text-xs text-gray-400 mt-2">{new Date(r.report_date).toLocaleDateString()}</p>
                                            </div>
                                            <FileText size={20} className="text-gray-400" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {/* 年报 */}
                    {yearlyReports.length > 0 && (
                        <div>
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Calendar size={20} className="text-purple-500" />{isZh ? '年报' : 'Annual Reports'}</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {yearlyReports.map(r => (
                                    <div key={r.id} onClick={() => viewReport(r.id)} className="bg-white rounded-xl shadow-md p-4 cursor-pointer hover:shadow-lg">
                                        <div className="flex justify-between">
                                            <div>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className={`px-2 py-1 text-xs rounded-full ${getTypeColor(r.report_type)}`}>{getTypeName(r.report_type)}</span>
                                                    <h3 className="font-semibold">{translateTitle(r)}</h3>
                                                </div>
                                                <p className="text-sm text-gray-600">{r.summary}</p>
                                                <p className="text-xs text-gray-400 mt-2">{new Date(r.report_date).toLocaleDateString()}</p>
                                            </div>
                                            <FileText size={20} className="text-gray-400" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}
            
            {/* 详情弹窗 */}
            {selectedReport && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedReport(null)}>
                    <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center">
                            <div>
                                <span className={`px-2 py-1 text-xs rounded-full ${getTypeColor(selectedReport.report_type)}`}>{getTypeName(selectedReport.report_type)}</span>
                                <h2 className="text-xl font-bold mt-1">{translateTitle(selectedReport)}</h2>
                                <p className="text-xs text-gray-400 mt-1">{new Date(selectedReport.report_date).toLocaleDateString()}</p>
                            </div>
                            <button onClick={() => setSelectedReport(null)} className="text-gray-500 text-xl">✕</button>
                        </div>
                        <div className="p-5 space-y-4">
                            {/* 总结 */}
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <p className="text-blue-800">{selectedReport.summary}</p>
                            </div>
                            
                            {/* 关键指标 */}
                            {selectedReport.metrics_data && (
                                <div>
                                    <h3 className="font-semibold flex items-center gap-2 mb-3"><Activity size={18} />{isZh ? '关键指标' : 'Key Metrics'}</h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        {selectedReport.metrics_data.avgSteps && <div className="bg-gray-50 p-3 rounded-lg"><p className="text-xs text-gray-500">{isZh ? '日均步数' : 'Daily Steps'}</p><p className="text-xl font-bold">{selectedReport.metrics_data.avgSteps}</p></div>}
                                        {selectedReport.metrics_data.avgSleep && <div className="bg-gray-50 p-3 rounded-lg"><p className="text-xs text-gray-500">{isZh ? '睡眠评分' : 'Sleep Score'}</p><p className="text-xl font-bold">{selectedReport.metrics_data.avgSleep}</p></div>}
                                        {selectedReport.metrics_data.avgWeight && <div className="bg-gray-50 p-3 rounded-lg"><p className="text-xs text-gray-500">{isZh ? '平均体重' : 'Avg Weight'}</p><p className="text-xl font-bold">{selectedReport.metrics_data.avgWeight} kg</p></div>}
                                        {selectedReport.metrics_data.avgBmi && <div className="bg-gray-50 p-3 rounded-lg"><p className="text-xs text-gray-500">BMI</p><p className="text-xl font-bold">{selectedReport.metrics_data.avgBmi}</p></div>}
                                    </div>
                                </div>
                            )}
                            
                            {/* 优点 */}
                            {selectedReport.good_points && selectedReport.good_points.length > 0 && (
                                <div className="bg-green-50 p-4 rounded-lg">
                                    <h3 className="font-semibold text-green-700 mb-2 flex items-center gap-2"><CheckCircle size={18} />{isZh ? '✅ 表现良好' : '✅ Good Points'}</h3>
                                    <ul className="space-y-1">
                                        {selectedReport.good_points.map((p, i) => (
                                            <li key={i} className="text-green-700 text-sm flex items-start gap-2">
                                                <CheckCircle size={14} className="mt-0.5 flex-shrink-0" />
                                                <span>{p}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            
                            {/* 改进建议 */}
                            {selectedReport.improvement_points && selectedReport.improvement_points.length > 0 && (
                                <div className="bg-orange-50 p-4 rounded-lg">
                                    <h3 className="font-semibold text-orange-700 mb-2 flex items-center gap-2"><AlertTriangle size={18} />{isZh ? '⚠️ 需要改进' : '⚠️ Areas to Improve'}</h3>
                                    <ul className="space-y-1">
                                        {selectedReport.improvement_points.map((p, i) => (
                                            <li key={i} className="text-orange-700 text-sm flex items-start gap-2">
                                                <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
                                                <span>{p}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            
                            {/* 健康风险 */}
                            {selectedReport.health_risks && selectedReport.health_risks.length > 0 && (
                                <div className="bg-red-50 p-4 rounded-lg">
                                    <h3 className="font-semibold text-red-700 mb-2 flex items-center gap-2"><Heart size={18} />{isZh ? '⚠️ 健康风险提示' : '⚠️ Health Risks'}</h3>
                                    <ul className="space-y-1">
                                        {selectedReport.health_risks.map((p, i) => (
                                            <li key={i} className="text-red-700 text-sm flex items-start gap-2">
                                                <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
                                                <span>{p}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
