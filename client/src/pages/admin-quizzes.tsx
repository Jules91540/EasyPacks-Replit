import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import Navigation from "@/components/ui/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Save, X, HelpCircle, Award, Target } from "lucide-react";

interface Quiz {
  id: number;
  moduleId: number;
  title: string;
  description: string;
  questions: Question[];
  passingScore: number;
  timeLimit: number;
  xpReward: number;
  isActive: boolean;
}

interface Question {
  id: number;
  question: string;
  options: string[];
  correct: number;
  explanation?: string;
}

interface QuizForm {
  moduleId: number;
  title: string;
  description: string;
  questions: Question[];
  passingScore: number;
  timeLimit: number;
  xpReward: number;
  isActive: boolean;
}

export default function AdminQuizzesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [quizForm, setQuizForm] = useState<QuizForm>({
    moduleId: 0,
    title: '',
    description: '',
    questions: [],
    passingScore: 70,
    timeLimit: 30,
    xpReward: 50,
    isActive: true
  });

  const { data: quizzes = [], isLoading: quizzesLoading } = useQuery({
    queryKey: ["/api/admin/quizzes"],
  });

  const { data: modules = [] } = useQuery({
    queryKey: ["/api/admin/modules"],
  });

  const createQuizMutation = useMutation({
    mutationFn: async (quizData: QuizForm) => {
      const response = await fetch("/api/admin/quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(quizData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create quiz');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Quiz créé",
        description: "Le quiz a été créé avec succès",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/quizzes"] });
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de créer le quiz",
        variant: "destructive",
      });
    },
  });

  const updateQuizMutation = useMutation({
    mutationFn: async ({ id, quizData }: { id: number; quizData: Partial<QuizForm> }) => {
      const response = await fetch(`/api/admin/quizzes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(quizData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update quiz');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Quiz mis à jour",
        description: "Le quiz a été modifié avec succès",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/quizzes"] });
      setIsEditDialogOpen(false);
      setEditingQuiz(null);
      resetForm();
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de modifier le quiz",
        variant: "destructive",
      });
    },
  });

  const deleteQuizMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/admin/quizzes/${id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete quiz');
      }
      
      return response.status === 204 ? null : response.json();
    },
    onSuccess: () => {
      toast({
        title: "Quiz supprimé",
        description: "Le quiz a été supprimé avec succès",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/quizzes"] });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le quiz",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setQuizForm({
      moduleId: 0,
      title: '',
      description: '',
      questions: [],
      passingScore: 70,
      timeLimit: 30,
      xpReward: 50,
      isActive: true
    });
  };

  const addQuestion = () => {
    const newQuestion: Question = {
      id: Date.now(),
      question: '',
      options: ['', '', '', ''],
      correct: 0,
      explanation: ''
    };
    setQuizForm({ 
      ...quizForm, 
      questions: [...quizForm.questions, newQuestion] 
    });
  };

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    const updatedQuestions = [...quizForm.questions];
    updatedQuestions[index] = { ...updatedQuestions[index], [field]: value };
    setQuizForm({ ...quizForm, questions: updatedQuestions });
  };

  const removeQuestion = (index: number) => {
    const updatedQuestions = quizForm.questions.filter((_, i) => i !== index);
    setQuizForm({ ...quizForm, questions: updatedQuestions });
  };

  const openEditDialog = (quiz: Quiz) => {
    setEditingQuiz(quiz);
    setQuizForm({
      moduleId: quiz.moduleId,
      title: quiz.title,
      description: quiz.description,
      questions: quiz.questions,
      passingScore: quiz.passingScore,
      timeLimit: quiz.timeLimit,
      xpReward: quiz.xpReward,
      isActive: quiz.isActive
    });
    setIsEditDialogOpen(true);
  };

  const handleCreateQuiz = () => {
    if (quizForm.questions.length === 0) {
      toast({
        title: "Erreur",
        description: "Le quiz doit contenir au moins une question",
        variant: "destructive",
      });
      return;
    }
    createQuizMutation.mutate(quizForm);
  };

  const handleUpdateQuiz = () => {
    if (editingQuiz) {
      updateQuizMutation.mutate({ id: editingQuiz.id, quizData: quizForm });
    }
  };

  const handleDeleteQuiz = (id: number) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce quiz ?')) {
      deleteQuizMutation.mutate(id);
    }
  };

  const getModuleName = (moduleId: number) => {
    const module = modules.find((m: any) => m.id === moduleId);
    return module ? module.title : 'Module non trouvé';
  };

  if (quizzesLoading) {
    return (
      <div className="h-screen bg-background flex overflow-hidden">
        <Navigation variant="admin" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-lg text-muted-foreground">Chargement des quiz...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex overflow-hidden">
      <Navigation variant="admin" />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-background border-b border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Gestion des Quiz</h1>
              <p className="text-muted-foreground">Créez et gérez les évaluations de vos modules</p>
            </div>
            
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gradient-primary text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Nouveau Quiz
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Créer un nouveau quiz</DialogTitle>
                </DialogHeader>
                <QuizFormContent 
                  quizForm={quizForm}
                  setQuizForm={setQuizForm}
                  modules={modules}
                  onSave={handleCreateQuiz}
                  onCancel={() => setIsCreateDialogOpen(false)}
                  isLoading={createQuizMutation.isPending}
                  addQuestion={addQuestion}
                  updateQuestion={updateQuestion}
                  removeQuestion={removeQuestion}
                />
              </DialogContent>
            </Dialog>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto">
            {quizzes.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <HelpCircle className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Aucun quiz créé</h3>
                  <p className="text-muted-foreground mb-4">
                    Commencez par créer votre premier quiz d'évaluation.
                  </p>
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Créer le premier quiz
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {quizzes.map((quiz: Quiz) => (
                  <Card key={quiz.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <CardTitle className="text-lg">{quiz.title}</CardTitle>
                            <Badge variant="outline">
                              {getModuleName(quiz.moduleId)}
                            </Badge>
                            {quiz.isActive ? (
                              <Badge variant="default">Actif</Badge>
                            ) : (
                              <Badge variant="secondary">Inactif</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{quiz.description}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => openEditDialog(quiz)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDeleteQuiz(quiz.id)}
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center space-x-2">
                          <HelpCircle className="h-4 w-4 text-muted-foreground" />
                          <span>{quiz.questions.length} questions</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Target className="h-4 w-4 text-muted-foreground" />
                          <span>{quiz.passingScore}% requis</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="h-4 w-4 text-muted-foreground">⏱</span>
                          <span>{quiz.timeLimit} min</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Award className="h-4 w-4 text-muted-foreground" />
                          <span>{quiz.xpReward} XP</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Modifier le quiz</DialogTitle>
            </DialogHeader>
            <QuizFormContent 
              quizForm={quizForm}
              setQuizForm={setQuizForm}
              modules={modules}
              onSave={handleUpdateQuiz}
              onCancel={() => setIsEditDialogOpen(false)}
              isLoading={updateQuizMutation.isPending}
              addQuestion={addQuestion}
              updateQuestion={updateQuestion}
              removeQuestion={removeQuestion}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

function QuizFormContent({ 
  quizForm, 
  setQuizForm, 
  modules,
  onSave, 
  onCancel, 
  isLoading,
  addQuestion,
  updateQuestion,
  removeQuestion
}: {
  quizForm: QuizForm;
  setQuizForm: (form: QuizForm) => void;
  modules: any[];
  onSave: () => void;
  onCancel: () => void;
  isLoading: boolean;
  addQuestion: () => void;
  updateQuestion: (index: number, field: keyof Question, value: any) => void;
  removeQuestion: (index: number) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="title">Titre du quiz</Label>
          <Input
            id="title"
            value={quizForm.title}
            onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })}
            placeholder="Ex: Quiz Introduction Streaming"
          />
        </div>
        <div>
          <Label htmlFor="module">Module associé</Label>
          <Select 
            value={quizForm.moduleId.toString()} 
            onValueChange={(value) => setQuizForm({ ...quizForm, moduleId: parseInt(value) })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner un module" />
            </SelectTrigger>
            <SelectContent>
              {modules.map((module: any) => (
                <SelectItem key={module.id} value={module.id.toString()}>
                  {module.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={quizForm.description}
          onChange={(e) => setQuizForm({ ...quizForm, description: e.target.value })}
          placeholder="Description du quiz..."
          rows={2}
        />
      </div>

      {/* Quiz Settings */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="passingScore">Score de réussite (%)</Label>
          <Input
            id="passingScore"
            type="number"
            value={quizForm.passingScore}
            onChange={(e) => setQuizForm({ ...quizForm, passingScore: parseInt(e.target.value) || 0 })}
            min="0"
            max="100"
          />
        </div>
        <div>
          <Label htmlFor="timeLimit">Durée (minutes)</Label>
          <Input
            id="timeLimit"
            type="number"
            value={quizForm.timeLimit}
            onChange={(e) => setQuizForm({ ...quizForm, timeLimit: parseInt(e.target.value) || 0 })}
            min="1"
          />
        </div>
        <div>
          <Label htmlFor="xpReward">Récompense XP</Label>
          <Input
            id="xpReward"
            type="number"
            value={quizForm.xpReward}
            onChange={(e) => setQuizForm({ ...quizForm, xpReward: parseInt(e.target.value) || 0 })}
            min="0"
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="isActive"
          checked={quizForm.isActive}
          onChange={(e) => setQuizForm({ ...quizForm, isActive: e.target.checked })}
          className="rounded border-gray-300"
        />
        <Label htmlFor="isActive">Quiz actif</Label>
      </div>

      {/* Questions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <Label className="text-lg">Questions</Label>
          <Button type="button" onClick={addQuestion} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Ajouter une question
          </Button>
        </div>

        {quizForm.questions.map((question, index) => (
          <Card key={question.id} className="mb-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Question {index + 1}</h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeQuestion(index)}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Question</Label>
                <Textarea
                  value={question.question}
                  onChange={(e) => updateQuestion(index, 'question', e.target.value)}
                  placeholder="Saisissez votre question..."
                  rows={2}
                />
              </div>

              <div>
                <Label>Options de réponse</Label>
                {question.options.map((option, optionIndex) => (
                  <div key={optionIndex} className="flex items-center space-x-2 mt-2">
                    <input
                      type="radio"
                      name={`question-${question.id}`}
                      checked={question.correct === optionIndex}
                      onChange={() => updateQuestion(index, 'correct', optionIndex)}
                    />
                    <Input
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...question.options];
                        newOptions[optionIndex] = e.target.value;
                        updateQuestion(index, 'options', newOptions);
                      }}
                      placeholder={`Option ${optionIndex + 1}`}
                    />
                  </div>
                ))}
              </div>

              <div>
                <Label>Explication (optionnel)</Label>
                <Textarea
                  value={question.explanation || ''}
                  onChange={(e) => updateQuestion(index, 'explanation', e.target.value)}
                  placeholder="Explication de la bonne réponse..."
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button variant="outline" onClick={onCancel}>
          <X className="h-4 w-4 mr-2" />
          Annuler
        </Button>
        <Button onClick={onSave} disabled={isLoading}>
          <Save className="h-4 w-4 mr-2" />
          {isLoading ? "Sauvegarde..." : "Sauvegarder"}
        </Button>
      </div>
    </div>
  );
}