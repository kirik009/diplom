
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { getQueryFn, apiRequest } from '@/lib/queryClient';
import { formatDateTime, calculateAttendancePercentage } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Users, School, Calendar, ClipboardList, Download, Eye, Trash, FileText } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useLocation } from 'wouter';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Class,Group, User, Report, Subject, Faculty } from '@shared/schema';

export default function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('reports');
  const [, setLocation] = useLocation();

  // Fetch all users
  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['/api/admin/users'],
    queryFn: getQueryFn({ on401: 'throw' }),
  });

  // Fetch all classes
  const { data: classes, isLoading: classesLoading } = useQuery<Class[]>({
    queryKey: ['/api/admin/classes'],
    queryFn: getQueryFn({ on401: 'throw' }),
  });

  // Fetch groups
  const { data: groups, isLoading: groupsLoading } = useQuery<Group[]>({
    queryKey: ['/api/groups'],
    queryFn: getQueryFn({ on401: 'throw' }),
  });

  // Fetch subjects
  const { data: subjects, isLoading: subjectsLoading } = useQuery<Subject[]>({
    queryKey: ['/api/subjects'],
    queryFn: getQueryFn({ on401: 'throw' }),
  });

  // Fetch faculties
  const { data: faculties, isLoading: facultiesLoading } = useQuery<Faculty[]>({
    queryKey: ['/api/faculties'],
    queryFn: getQueryFn({ on401: 'returnNull' }),
  });

  // Fetch reports
  const { data: reports, isLoading: reportsLoading } = useQuery<Report[]>({
    queryKey: ['/api/admin/reports'],
    queryFn: getQueryFn({ on401: 'throw' }),
  });

  const isLoading = usersLoading || classesLoading || groupsLoading || subjectsLoading || facultiesLoading || reportsLoading;

  // Form state for report generation
  const [reportForm, setReportForm] = useState({
    name: '',
    type: 'attendance',
    period: 'month',
    format: 'pdf',
    startDate: '',
    endDate: ''
  });

  // Mutation for generating reports
  const generateReportMutation = useMutation({
    mutationFn: async (reportData: any) => {
      const response = await apiRequest('POST', '/api/admin/reports', reportData);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/reports'] });
      toast({
        title: 'Отчет создан',
        description: 'Отчет успешно сформирован и сохранен в базу данных',
      });
      setReportForm({
        name: '',
        type: 'attendance',
        period: 'month',
        format: 'pdf',
        startDate: '',
        endDate: ''
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось создать отчет',
        variant: 'destructive',
      });
    },
  });

  // Mutation for deleting reports
  const deleteReportMutation = useMutation({
        mutationFn: async (reportId: number) => {
      const response = await apiRequest('DELETE', `/api/admin/reports/${reportId}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/reports'] });
      toast({
        title: 'Отчет удален',
        description: 'Отчет успешно удален из базы данных',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось удалить отчет',
        variant: 'destructive',
      });
    },
  });

  const handleReportFormChange = (field: string, value: string) => {
    setReportForm({
      ...reportForm,
      [field]: value
    });
  };

  const handleGenerateReport = async () => {
    if (!reportForm.name.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Введите название отчета',
        variant: 'destructive',
      });
      return;
    }

    if (reportForm.period === 'custom' && (!reportForm.startDate || !reportForm.endDate)) {
      toast({
        title: 'Ошибка',
        description: 'Выберите даты для произвольного периода',
        variant: 'destructive',
      });
      return;
    }

    let reportData: any = {};

    // Generate different types of reports
    switch (reportForm.type) {
      case 'attendance':
        // Generate attendance data
        reportData = {
          totalStudents: users?.filter(u => u.role === 'student').length || 0,
          totalClasses: classes?.length || 0,
          averageAttendance: 85, // Mock calculation
          attendanceByGroup: groups?.map(g => ({
            groupName: g.name,
            attendance: Math.floor(Math.random() * 30) + 70 // Mock data
          })) || []
        };
        break;
      case 'stats':
        // Generate teacher statistics
        reportData = {
          totalTeachers: users?.filter(u => u.role === 'teacher').length || 0,
          classesPerTeacher: classes ? classes.length / (users?.filter(u => u.role === 'teacher').length || 1) : 0,
          teacherActivity: users?.filter(u => u.role === 'teacher').map(t => ({
            teacherName: `${t.firstName} ${t.lastName}`,
            classesCount: Math.floor(Math.random() * 20) + 5 // Mock data
          })) || []
        };
        break;
      case 'groups':
        // Generate group statistics
        reportData = {
          totalGroups: groups?.length || 0,
          studentsPerGroup: groups?.map(g => ({
            groupName: g.name,
            studentsCount: Math.floor(Math.random() * 25) + 15 // Mock data
          })) || []
        };
        break;
      case 'subjects':
        // Generate subject statistics
        reportData = {
          totalSubjects: subjects?.length || 0,
          subjectPopularity: subjects?.map(s => ({
            subjectName: s.name,
            classesCount: Math.floor(Math.random() * 30) + 10 // Mock data
          })) || []
        };
        break;
    }

    const report = {
      name: reportForm.name,
      type: reportForm.type,
      period: reportForm.period,
      format: reportForm.format,
      startDate: reportForm.startDate || null,
      endDate: reportForm.endDate || null,
      data: reportData
    };

    generateReportMutation.mutate(report);
  };

  const handleDownloadReport = async (reportId: number, format: string, filename: string) => {
    try {
      const response = await fetch(`/api/admin/reports/${reportId}/download`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Не удалось скачать отчет');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.${format.toLowerCase()}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Успешно',
        description: 'Отчет скачан',
      });
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось скачать отчет',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteReport = (reportId: number) => {
    if (window.confirm('Вы уверены, что хотите удалить этот отчет?')) {
      deleteReportMutation.mutate(reportId);
    }
  };

  // Get faculty attendance stats
  const getFacultyStats = () => {
    if (!faculties) return [];

    return [
      { id: 1, name: 'Физико-математический', percentage: 87 },
      { id: 2, name: 'Информационных технологий', percentage: 83 },
      { id: 3, name: 'Экономический', percentage: 75 },
      { id: 4, name: 'Юридический', percentage: 72 },
      { id: 5, name: 'Филологический', percentage: 65 }
    ];
  };

  const facultyStats = getFacultyStats();

  const getReportTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      attendance: 'Посещаемость',
      stats: 'Статистика по преподавателям',
      groups: 'Статистика по группам',
      subjects: 'Статистика по предметам'
    };
    return types[type] || type;
  };

  const getPeriodLabel = (period: string) => {
    const periods: Record<string, string> = {
      week: 'Неделя',
      month: 'Месяц',
      semester: 'Семестр',
      year: 'Год',
      custom: 'Произвольный период'
    };
    return periods[period] || period;
  };

  return (
    <div className="mb-6">
      <h2 className="text-2xl font-medium text-gray-800 mb-4">Панель администратора</h2>

      {/* Admin Tabs */}
      <Card className="mb-8">
        <Tabs defaultValue="reports" onValueChange={setActiveTab}>
          <div className="border-b border-gray-200">
            <TabsList className="flex h-auto rounded-none border-b border-0 bg-transparent">
              <TabsTrigger 
                value="reports" 
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none border-b-2 border-transparent px-6 py-4 font-medium text-sm"
              >
                Отчеты
              </TabsTrigger>
              <TabsTrigger 
                value="users" 
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none border-b-2 border-transparent px-6 py-4 font-medium text-sm"
              >
                Пользователи
              </TabsTrigger>
              <TabsTrigger 
                value="groups" 
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none border-b-2 border-transparent px-6 py-4 font-medium text-sm"
              >
                Группы
              </TabsTrigger>
              <TabsTrigger 
                value="departments" 
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none border-b-2 border-transparent px-6 py-4 font-medium text-sm"
              >
                Кафедры
              </TabsTrigger>
              <TabsTrigger 
                value="faculties" 
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none border-b-2 border-transparent px-6 py-4 font-medium text-sm"
              >
                Факультеты
              </TabsTrigger>
              <TabsTrigger 
                value="subjects" 
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none border-b-2 border-transparent px-6 py-4 font-medium text-sm"
              >
                Предметы
              </TabsTrigger>
              <TabsTrigger 
                value="settings" 
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none border-b-2 border-transparent px-6 py-4 font-medium text-sm"
              >
                Настройки
              </TabsTrigger>
            </TabsList>
          </div>
          <div className="p-6">
            <TabsContent value="reports" className="m-0">
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-800 mb-4">Создать отчет</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="reportName" className="block text-sm font-medium text-gray-700 mb-1">
                      Название отчета
                    </Label>
                    <Input
                      id="reportName"
                      value={reportForm.name}
                      onChange={(e) => handleReportFormChange('name', e.target.value)}
                      placeholder="Введите название отчета"
                    />
                  </div>
                  <div>
                    <Label htmlFor="reportType" className="block text-sm font-medium text-gray-700 mb-1">
                      Тип отчета
                    </Label>
                    <Select
                      value={reportForm.type}
                      onValueChange={(value) => handleReportFormChange('type', value)}
                    >
                      <SelectTrigger id="reportType" className="w-full">
                        <SelectValue placeholder="Выберите тип отчета" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="attendance">Посещаемость</SelectItem>
                        <SelectItem value="stats">Статистика по преподавателям</SelectItem>
                        <SelectItem value="groups">Статистика по группам</SelectItem>
                        <SelectItem value="subjects">Статистика по предметам</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="reportPeriod" className="block text-sm font-medium text-gray-700 mb-1">
                      Период
                    </Label>
                    <Select
                      value={reportForm.period}
                      onValueChange={(value) => handleReportFormChange('period', value)}
                    >
                      <SelectTrigger id="reportPeriod" className="w-full">
                        <SelectValue placeholder="Выберите период" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="week">Неделя</SelectItem>
                        <SelectItem value="month">Месяц</SelectItem>
                        <SelectItem value="semester">Семестр</SelectItem>
                        <SelectItem value="year">Год</SelectItem>
                        <SelectItem value="custom">Произвольный период</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {reportForm.period === 'custom' && (
                    <>
                      <div>
                        <Label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                          Дата начала
                        </Label>
                        <Input
                          id="startDate"
                          type="date"
                          value={reportForm.startDate}
                          onChange={(e) => handleReportFormChange('startDate', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                          Дата окончания
                        </Label>
                        <Input
                          id="endDate"
                          type="date"
                          value={reportForm.endDate}
                          onChange={(e) => handleReportFormChange('endDate', e.target.value)}
                        />
                      </div>
                    </>
                  )}
                  <div>
                    <Label htmlFor="reportFormat" className="block text-sm font-medium text-gray-700 mb-1">
                      Формат
                    </Label>
                    <Select
                      value={reportForm.format}
                      onValueChange={(value) => handleReportFormChange('format', value)}
                    >
                      <SelectTrigger id="reportFormat" className="w-full">
                        <SelectValue placeholder="Выберите формат" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pdf">PDF</SelectItem>
                        <SelectItem value="excel">Excel</SelectItem>
                        <SelectItem value="csv">CSV</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2 lg:col-span-3">
                    <Button 
                      className="w-full" 
                      onClick={handleGenerateReport}
                      disabled={generateReportMutation.isPending}
                    >
                      <ClipboardList className="mr-2 h-4 w-4" />
                      {generateReportMutation.isPending ? 'Формирование...' : 'Сформировать отчет'}
                    </Button>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-4">Сохраненные отчеты</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Название</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Тип</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Период</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Создан</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Формат</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Действия</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reports?.map((report) => (
                        <tr key={report.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{report.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {getReportTypeLabel(report.type)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {getPeriodLabel(report.period)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {formatDateTime(report.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            <span className={`px-2 py-1 text-xs rounded ${
                              report.format === 'pdf' ? 'bg-blue-100 text-blue-800' :
                              report.format === 'excel' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {report.format.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex space-x-2">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="text-gray-500 hover:text-gray-700"
                                onClick={() => handleDownloadReport(report.id, report.format, report.name)}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="text-red-500 hover:text-red-700"
                                onClick={() => handleDeleteReport(report.id)}
                                disabled={deleteReportMutation.isPending}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {(!reports || reports.length === 0) && (
                        <tr>
                          <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                            Отчеты не найдены
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="users" className="m-0">
              <div className="text-center py-16">
                <div className="text-gray-400 text-5xl mb-4">
                  <Users className="h-16 w-16 mx-auto opacity-20" />
                </div>
                <h3 className="text-xl font-medium text-gray-700 mb-2">Управление пользователями</h3>
                <p className="text-gray-500 mb-4">Здесь вы можете добавлять, редактировать и удалять пользователей системы</p>
                <Button className="mt-2" onClick={() => setLocation('/admin/users')}>
                  Управление пользователями
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="groups" className="m-0">
              <div className="text-center py-16">
                <div className="text-gray-400 text-5xl mb-4">
                  <Users className="h-16 w-16 mx-auto opacity-20" />
                </div>
                <h3 className="text-xl font-medium text-gray-700 mb-2">Управление группами</h3>
                <p className="text-gray-500 mb-4">Здесь вы можете создавать и редактировать группы студентов</p>
                <Button className="mt-2" onClick={() => setLocation('/admin/groups')}>
                  Управление группами
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="departments" className="m-0">
              <div className="text-center py-16">
                <div className="text-gray-400 text-5xl mb-4">
                  <Users className="h-16 w-16 mx-auto opacity-20" />
                </div>
                <h3 className="text-xl font-medium text-gray-700 mb-2">Управление кафедрами</h3>
                <p className="text-gray-500 mb-4">Здесь вы можете создавать и редактировать кафедры</p>
                <Button className="mt-2" onClick={() => setLocation('/admin/departments')}>
                  Управление кафедрами
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="faculties" className="m-0">
              <div className="text-center py-16">
                <div className="text-gray-400 text-5xl mb-4">
                  <Users className="h-16 w-16 mx-auto opacity-20" />
                </div>
                <h3 className="text-xl font-medium text-gray-700 mb-2">Управление факультетами</h3>
                <p className="text-gray-500 mb-4">Здесь вы можете создавать и редактировать факультеты</p>
                <Button className="mt-2" onClick={() => setLocation('/admin/faculties')}>
                  Управление факультетами
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="subjects" className="m-0">
              <div className="text-center py-16">
                <div className="text-gray-400 text-5xl mb-4">
                  <FileText className="h-16 w-16 mx-auto opacity-20" />
                </div>
                <h3 className="text-xl font-medium text-gray-700 mb-2">Управление предметами</h3>
                <p className="text-gray-500 mb-4">Здесь вы можете добавлять и редактировать учебные предметы</p>
                <Button className="mt-2" onClick={() => setLocation('/admin/subjects')}>
                  Управление предметами
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="m-0">
              <div className="text-center py-16">
                <div className="text-gray-400 text-5xl mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto opacity-20"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                </div>
                <h3 className="text-xl font-medium text-gray-700 mb-2">Настройки системы</h3>
                <p className="text-gray-500 mb-4">Здесь вы можете настроить параметры системы учета посещаемости</p>
                <Button className="mt-2">
                  Настройки системы
                </Button>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </Card>

      {/* Overall Statistics */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-xl font-medium text-gray-800 mb-4">Общая статистика посещаемости</h3>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="col-span-1 lg:col-span-2">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="h-80 flex items-center justify-center">
                  <div className="text-center">
                    <BarChart className="text-gray-400 text-5xl mb-2 mx-auto h-16 w-16" />
                    <p className="text-gray-500">График общей посещаемости по факультетам</p>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <h4 className="font-medium text-gray-700 mb-3">Рейтинг факультетов</h4>
                <div className="space-y-3">
                  {facultyStats.map(faculty => (
                    <div key={faculty.id}>
                      <div className="flex justify-between text-sm mb-1">
                        <div>{faculty.name}</div>
                        <div>{faculty.percentage}%</div>
                      </div>
                      <Progress 
                        value={faculty.percentage} 
                        className={`h-2 ${
                          faculty.percentage >= 80 ? 'bg-success' : 
                          faculty.percentage >= 60 ? 'bg-primary' : 'bg-warning'
                        }`}
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div className="text-center">
                <Button className="w-full">
                  Экспортировать полный отчет
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
