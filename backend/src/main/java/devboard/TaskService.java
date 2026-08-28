package devboard;

import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.NoSuchElementException;

@Service
public class TaskService {

    private final TaskRepository repository;

    public TaskService(TaskRepository repository) {
        this.repository = repository;
    }

    public List<Task> getAllTasks() {
        return repository.findAll();
    }

    public Task getTask(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Task not found: " + id));
    }

    public Task createTask(Task task) {
        task.setId(null);
        task.setCreatedAt(LocalDate.now());
        if (task.getStatus() == Status.DONE) {
            task.setCompletedAt(LocalDate.now());
        } else {
            task.setCompletedAt(null);
        }
        return repository.save(task);
    }

    public Task updateTask(Long id, Task updated) {
        Task existing = getTask(id);
        existing.setTitle(updated.getTitle());
        existing.setDescription(updated.getDescription());
        existing.setPriority(updated.getPriority());
        existing.setDueDate(updated.getDueDate());
        applyStatusChange(existing, updated.getStatus());
        return repository.save(existing);
    }

    public Task updateStatus(Long id, Status newStatus) {
        Task existing = getTask(id);
        applyStatusChange(existing, newStatus);
        return repository.save(existing);
    }

    private void applyStatusChange(Task task, Status newStatus) {
        boolean wasDone = task.getStatus() == Status.DONE;
        task.setStatus(newStatus);
        if (newStatus == Status.DONE && !wasDone) {
            task.setCompletedAt(LocalDate.now());
        } else if (newStatus != Status.DONE) {
            task.setCompletedAt(null);
        }
    }

    public void deleteTask(Long id) {
        if (!repository.existsById(id)) {
            throw new NoSuchElementException("Task not found: " + id);
        }
        repository.deleteById(id);
    }
}
