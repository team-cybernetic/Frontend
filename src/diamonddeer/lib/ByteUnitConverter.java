/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package diamonddeer.lib;

/**
 * @author Tootoot222
 */
public class ByteUnitConverter {

    /**
     * Converts a number of bytes into a 5 significant digit number (123.45), and unit character (k, M, G, T, P, E) plus suffix
     *
     * @param bytes Number of bytes to convert
     * @param radix Number of bytes at which to change the unit symbol (1000 or 1024 is common)
     * @return String formatted number at index 0, unit character at index 1
     */
    public static String[] bytesToUnitSplit(long bytes, long radix, String suffix) {
        int u;
        for (u = 0; bytes > radix * radix; bytes /= radix) {
            u++;
        }
        if (bytes > radix) {
            u++;
        }
        String[] res = {String.format("%.2f", bytes / ((float) radix)), String.format("%c%s", "kMGTPE".charAt(u), suffix)};
        return (res);
    }

    public static String bytesToBinaryUnit(long bytes) {
        String[] split = bytesToBinaryUnitSplit(bytes);
        return (String.format("%s %s", split[0], split[1]));
    }

    public static String[] bytesToBinaryUnitSplit(long bytes) {
        return (bytesToUnitSplit(bytes, 1024, "iB"));
    }

    public static String bytesToSIUnit(long bytes) {
        String[] split = bytesToSIUnitSplit(bytes);
        return (String.format("%s %s", split[0], split[1]));
    }

    public static String[] bytesToSIUnitSplit(long bytes) {
        return (bytesToUnitSplit(bytes, 1000, "B"));
    }

    /**
     * Uses the system default function. Could be configurabile
     *
     * @param bytes number of bytes to convert
     * @return A string representation of the number of bytes in the system default format
     */
    public static String bytesToUnit(long bytes) {
        return (bytesToSIUnit(bytes));
    }

    public static String[] bytesToUnitSplit(long bytes) {
        return (bytesToSIUnitSplit(bytes));
    }
}
