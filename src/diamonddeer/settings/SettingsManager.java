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
package diamonddeer.settings;

import javafx.beans.property.IntegerProperty;
import javafx.beans.property.SimpleIntegerProperty;

/**
 * @author Tootoot222
 */
public class SettingsManager implements PostSettings {

    public static final int DEFAULT_MAX_POST_COLUMNS = 2;

    IntegerProperty maxPostColumns = new SimpleIntegerProperty(DEFAULT_MAX_POST_COLUMNS);

    public SettingsManager() {

    }

    @Override
    public int getMaxPostColumns() {
        return (maxPostColumns.get());
    }

    @Override
    public void setMaxPostColumns(int newMaxPostColumns) {
        maxPostColumns.set(newMaxPostColumns);
    }

    @Override
    public IntegerProperty getMaxPostColumnsProperty() {
        return (maxPostColumns);
    }
}
