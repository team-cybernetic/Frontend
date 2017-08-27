/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package diamonddeer.lib;

import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.Date;

/**
 * @author Tootoot222
 */
public class TimeConverter {
    public static String dateTimeFromMillis(long millis) {
        Date date = new Date(millis);
        //TODO: allow localized settings for date/time format
        DateFormat formatter = new SimpleDateFormat("HH:mm:ss dd/MM/yyyy");
        return (formatter.format(date));
    }
}
