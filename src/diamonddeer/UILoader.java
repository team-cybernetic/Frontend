package diamonddeer;

import beryloctopus.BerylOctopus;
import beryloctopus.models.UserIdentity;
import diamonddeer.settings.SettingsManager;
import diamonddeer.ui.editor.EditorController;
import diamonddeer.ui.editor.EditorLoader;
import diamonddeer.ui.editor.EditorUI;
import diamonddeer.ui.mainwindow.MainWindowController;
import diamonddeer.ui.post.PostController;
import diamonddeer.ui.post.PostLoader;
import diamonddeer.ui.post.PostUI;
import diamonddeer.ui.postcomment.PostCommentController;
import diamonddeer.ui.postcomment.PostCommentLoader;
import diamonddeer.ui.postcomment.PostCommentUI;
import diamonddeer.ui.sidebar.SidebarController;
import diamonddeer.ui.sidebar.SidebarLoader;
import diamonddeer.ui.sidebar.SidebarUI;
import javafx.fxml.FXMLLoader;
import javafx.scene.Parent;
import javafx.scene.Scene;
import javafx.scene.layout.AnchorPane;
import javafx.scene.layout.Pane;
import javafx.stage.Stage;

import java.io.IOException;
import java.security.NoSuchAlgorithmException;

/**
 * @author Tootoot222
 */
public class UILoader implements PostLoader, EditorLoader, PostCommentLoader, SidebarLoader {
    private Stage mainStage;

    private Pane mainWindowPane;
    private MainWindowController mainWindowController;
    private BerylOctopus model;
    private SettingsManager settingsManager;

    public UILoader(Stage mainStage, BerylOctopus model, SettingsManager settingsManager) {
        this.mainStage = mainStage;
        this.model = model;
        this.settingsManager = settingsManager;
    }

    public void load() throws IOException, NoSuchAlgorithmException {
        Scene scene = new Scene(loadMainWindow());
        mainStage.setScene(scene);
        mainStage.show();
    }

    private Parent loadMainWindow() throws IOException, NoSuchAlgorithmException {
        FXMLLoader loader = new FXMLLoader();
        loader.setLocation(getClass().getResource("ui/mainwindow/MainWindow.fxml"));
        this.mainWindowPane = loader.load();
        this.mainWindowController = loader.getController();
        mainWindowController.setup(model, new UserIdentity(), this, this, this, this, settingsManager);
        return (mainWindowPane);
    }

    @Override
    public PostUI loadEmptyPost() throws IOException {
        FXMLLoader loader = new FXMLLoader();
        loader.setLocation(getClass().getResource("ui/post/Post.fxml"));
        Pane layout = loader.load();
        PostController controller = loader.getController();
        return (new PostUI(layout, controller));
    }

    @Override
    public PostCommentUI loadEmptyPostComment() throws IOException {
        FXMLLoader loader = new FXMLLoader();
        loader.setLocation(getClass().getResource("ui/postcomment/PostComment.fxml"));
        Pane layout = loader.load();
        PostCommentController controller = loader.getController();
        return (new PostCommentUI(layout, controller));
    }

    public SidebarUI loadSidebar() throws IOException {
        FXMLLoader loader = new FXMLLoader();
        loader.setLocation(getClass().getResource("ui/sidebar/Sidebar.fxml"));
        AnchorPane layout = loader.load();
        SidebarController controller = loader.getController();
        return (new SidebarUI(layout, controller));
    }

    @Override
    public EditorUI loadEditor() throws IOException {
        FXMLLoader loader = new FXMLLoader();
        loader.setLocation(getClass().getResource("ui/editor/Editor.fxml"));
        Pane layout = loader.load();
        EditorController controller = loader.getController();
        return (new EditorUI(layout, controller));
    }
}
