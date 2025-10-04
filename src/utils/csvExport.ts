import { Todo } from '../types/todo';

export const exportToCSV = (todos: Todo[]) => {
    // Define CSV headers
    const headers = ['Task', 'Status', 'Due Date', 'Is Overdue'];
    
    // Convert todos to CSV rows
    const rows = todos.map(todo => {
        const dueDate = todo.dueDate ? new Date(todo.dueDate) : null;
        const now = new Date();
        const isOverdue = dueDate ? dueDate < now && !todo.completed : false;
        
        return [
            todo.text,
            todo.completed ? 'Completed' : 'Pending',
            dueDate ? dueDate.toLocaleString() : 'No due date',
            isOverdue ? 'Yes' : 'No'
        ];
    });

    // Combine headers and rows
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `todo-list-${new Date().toLocaleDateString()}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};