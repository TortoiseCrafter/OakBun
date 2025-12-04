// 1. Der generische Typ (Der "Container")
// Entweder Erfolg (Daten da, Error null) ODER Fehler (Daten null, Error da)
type Result<T, E = Error> =
    | { data: T; error: null }
    | { data: null; error: E };

async function middleware(next: (auto: string) => Promise<void> | void) {
    console.log("auto")
    await next(auto)
}

function test(): Result<string[]> {
    try {
        const data: string[] = ["Hallo", "Go"];

        throw new Error('Upss')

        // return { data, error: null }; // TS weiß: Hier ist error null
    } catch (e) {
        // Wir fangen den JS-Error und geben ihn als Wert zurück
        const error = e instanceof Error ? e : new Error(String(e));
        return { data: null, error };
    }
}

async function main() {
    const { data, error } = test();

    if (error) {
        console.error("Fehler:", error.message);
        return; // JETZT ist das return erlaubt (beendet main)
    }

    console.log("Erfolg:", data);
}

// Wir rufen main auf
main();