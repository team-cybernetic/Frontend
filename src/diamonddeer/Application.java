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
import diamonddeer.lib.Debug;
import diamonddeer.settings.SettingsManager;
import javafx.stage.Stage;

import java.io.IOException;

/**
 * @author Tootoot222
 */
public class Application extends javafx.application.Application {
    private UILoader uiLoader;
    private BerylOctopus model;
    private SettingsManager settingsManager;

    /**
     * @param args the command line arguments
     */
    public static void main(String[] args) {
        launch(args);
    }

    @Override
    public void start(Stage stage) throws Exception {
        try {
            this.model = new BerylOctopusDummy1();
            this.settingsManager = new SettingsManager();
            this.uiLoader = new UILoader(stage, model, settingsManager);
            uiLoader.load();
        } catch (IOException ex) {
            Debug.fatal("Failed to create main controller: %s", ex.toString());
            throw (ex);
        }
    }
}
