/* 
 * Copyright (C) 2017 Tootoot222
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
package diamonddeer;

import beryloctopus.BerylOctopus;
import diamonddeer.mainwindow.MainWindowController;
import diamonddeer.mainwindow.post.PostUI;
import diamonddeer.mainwindow.post.PostController;
import diamonddeer.mainwindow.post.PostLoader;
import diamonddeer.settings.SettingsManager;
import java.io.IOException;
import javafx.fxml.FXMLLoader;
import javafx.scene.Parent;
import javafx.scene.Scene;
import javafx.scene.layout.Pane;
import javafx.stage.Stage;

/**
 *
 * @author Tootoot222
 */
public class DiamondDeerController implements PostLoader {
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
        loader.setLocation(getClass().getResource("MainWindow/MainWindow.fxml"));
        this.mainWindowPane = loader.load();
        this.mainWindowController = loader.getController();
        mainWindowController.setup(model, this, settingsManager);
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
        loader.setLocation(getClass().getResource("MainWindow/Post/Post.fxml"));
        Pane layout = loader.load();
        PostController controller = loader.getController();
        return (new PostUI(layout, controller));
    }
}
