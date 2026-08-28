package devboard;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
public class DataSeeder implements CommandLineRunner {

    private final TaskRepository repository;

    public DataSeeder(TaskRepository repository) {
        this.repository = repository;
    }

    @Override
    public void run(String... args) {
        if (repository.count() > 0) return;

        Task t1 = new Task();
        t1.setTitle("Set up project repo");
        t1.setDescription("Initialize git, add README, push to GitHub.");
        t1.setPriority(Priority.MEDIUM);
        t1.setStatus(Status.DONE);
        t1.setCompletedAt(LocalDate.now());

        Task t2 = new Task();
        t2.setTitle("Build REST API in Spring Boot");
        t2.setDescription("Expose CRUD endpoints for tasks.");
        t2.setPriority(Priority.HIGH);
        t2.setStatus(Status.PROGRESS);

        Task t3 = new Task();
        t3.setTitle("Write project README");
        t3.setDescription("Document setup and API endpoints.");
        t3.setPriority(Priority.LOW);
        t3.setStatus(Status.TODO);

        repository.saveAll(java.util.List.of(t1, t2, t3));
    }
}
