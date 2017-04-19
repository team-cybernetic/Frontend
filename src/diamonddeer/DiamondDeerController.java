package diamonddeer;

import beryloctopus.BerylOctopus;
import diamonddeer.mainwindow.MainWindowController;
import diamonddeer.mainwindow.editor.EditorController;
import diamonddeer.mainwindow.editor.EditorLoader;
import diamonddeer.mainwindow.editor.EditorUI;
import diamonddeer.mainwindow.post.PostUI;
import diamonddeer.mainwindow.post.PostController;
import diamonddeer.mainwindow.post.PostLoader;
import diamonddeer.mainwindow.post.comment.PostCommentController;
import diamonddeer.mainwindow.post.comment.PostCommentLoader;
import diamonddeer.mainwindow.post.comment.PostCommentUI;
import diamonddeer.mainwindow.sidebar.SidebarController;
import diamonddeer.mainwindow.sidebar.SidebarLoader;
import diamonddeer.mainwindow.sidebar.SidebarUI;
import diamonddeer.settings.SettingsManager;
import java.io.IOException;
import javafx.fxml.FXMLLoader;
import javafx.scene.Parent;
import javafx.scene.Scene;
import javafx.scene.layout.AnchorPane;
import javafx.scene.layout.Pane;
import javafx.stage.Stage;

/**
 *
 * @author Tootoot222
 */
public class DiamondDeerController implements PostLoader, EditorLoader, PostCommentLoader, SidebarLoader {
    private Stage mainStage;

    private Pane mainWindowPane;
    private MainWindowController mainWindowController;
    private BerylOctopus model;
    private SettingsManager settingsManager;

    public DiamondDeerController(Stage mainStage) {
        this.mainStage = mainStage;
    }

    private Parent loadMainWindow() throws IOException {
        FXMLLoader loader = new FXMLLoader();
        loader.setLocation(getClass().getResource("mainwindow/MainWindow.fxml"));
        this.mainWindowPane = loader.load();
        this.mainWindowController = loader.getController();
        mainWindowController.setup(model, loadEditor(), this, this, this, settingsManager);
        return (mainWindowPane);
    }

    public void setup(BerylOctopus model, SettingsManager settingsManager) throws IOException {
        this.model = model;
        this.settingsManager = settingsManager;

        Scene scene = new Scene(loadMainWindow());
        
        mainStage.setScene(scene);
        mainStage.show();

    }

    @Override
    public PostUI loadEmptyPost() throws IOException {
        FXMLLoader loader = new FXMLLoader();
        loader.setLocation(getClass().getResource("mainwindow/post/Post.fxml"));
        Pane layout = loader.load();
        PostController controller = loader.getController();
        return (new PostUI(layout, controller));
    }

    @Override
    public PostCommentUI loadEmptyPostComment() throws IOException {
        FXMLLoader loader = new FXMLLoader();
        loader.setLocation(getClass().getResource("mainwindow/post/comment/PostComment.fxml"));
        Pane layout = loader.load();
        PostCommentController controller = loader.getController();
        return (new PostCommentUI(layout, controller));
    }

    public SidebarUI loadSidebar() throws IOException {
        FXMLLoader loader = new FXMLLoader();
        loader.setLocation(getClass().getResource("mainwindow/sidebar/Sidebar.fxml"));
        AnchorPane layout = loader.load();
        SidebarController controller = loader.getController();
        return (new SidebarUI(layout, controller));
    }

    @Override
    public EditorUI loadEditor() throws IOException {
        FXMLLoader loader = new FXMLLoader();
        loader.setLocation(getClass().getResource("mainwindow/editor/Editor.fxml"));
        Pane layout = loader.load();
        EditorController controller = loader.getController();
        return (new EditorUI(layout, controller));
    }
}
