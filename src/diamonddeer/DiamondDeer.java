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
import beryloctopus.BerylOctopusDummy1;
import diamonddeer.Settings.SettingsManager;
import diamonddeer.lib.Debug;
import java.io.IOException;
import javafx.application.Application;
import javafx.stage.Stage;

/**
 *
 * @author Tootoot222
 */
public class DiamondDeer extends Application {

    private DiamondDeerController mainController;
    private BerylOctopus model = new BerylOctopusDummy1();
    private SettingsManager settingsManager;
    
    @Override
    public void start(Stage stage) throws Exception {
        try {
            this.mainController = new DiamondDeerController(stage);
            this.settingsManager = new SettingsManager();
            mainController.setup(model, settingsManager);
        } catch (IOException ex) {
            Debug.fatal("Failed to create main controller: %s", ex.toString());
            throw (ex);
        }
    }

    /**
     * @param args the command line arguments
     */
    public static void main(String[] args) {
        launch(args);
    }
    
}
