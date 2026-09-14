export type Language = 'it' | 'en';
export type Localized = {it: string; en: string};
export interface Mission { id: number; name: Localized; location: Localized; description: Localized; environment: string; difficulty: number; available: boolean; timeLimit: number; reward: number; }
const names = [
 ['Operazione Porto Nero','Operation Black Harbor','Porto commerciale · Italia','Commercial harbor · Italy','Un carico senza documenti. Un uomo che sa troppo.','An undocumented shipment. One man who knows too much.','port'],
 ['Ostaggio al 17° piano','Hostage on the 17th floor','Distretto finanziario','Financial district','Una finestra. Una sola occasione.','One window. One chance.','city'],
 ['Convoglio fantasma','Ghost convoy','Zona industriale','Industrial zone','Ferma il convoglio prima che scompaia.','Stop the convoy before it disappears.','industrial'],
 ['Il traditore','The traitor','Milano','Milan','La folla nasconde un segreto.','The crowd hides a secret.','city'],
 ['Docky trova la pista','Docky follows the trail','Magazzino abbandonato','Abandoned warehouse','Fidati del suo istinto.','Trust his instincts.','industrial'],
 ['Operazione ambasciata','Embassy operation','Quartiere diplomatico','Diplomatic quarter','Nessuno è chi sembra.','No one is who they seem.','city'],
 ['Treno 419','Train 419','Scalo ferroviario','Rail yard','Il tempo corre sui binari.','Time races down the tracks.','industrial'],
 ['Tempesta sul porto','Harbor storm','Porto commerciale','Commercial harbor','La pioggia cancella le tracce.','Rain washes away the tracks.','port'],
 ['Salva Docky','Save Docky','Base nemica','Enemy base','Questa volta è personale.','This time it is personal.','industrial'],
 ['Protocollo CAPI','CAPI protocol','Località sconosciuta','Unknown location','Tutto era collegato.','It was all connected.','city'],
];
export const missions: Mission[] = names.map((n,i) => ({id:i+1,name:{it:n[0],en:n[1]},location:{it:n[2],en:n[3]},description:{it:n[4],en:n[5]},environment:n[6],difficulty:Math.min(5,1+Math.floor(i/2)),available:i===0,timeLimit:90,reward:1000}));
export const briefing = {it:'CAPI, una nave ha attraccato senza autorizzazione. Il responsabile indossa una maglia rossa, controlla le casse e usa il telefono. Identificalo prima di agire. Due uomini armati e due lavoratori sono nell’area: non sono il tuo obiettivo. Docky è in posizione.',en:'CAPI, a ship has docked without authorization. The coordinator wears a red shirt, checks the crates and uses a phone. Identify him before acting. Two armed men and two workers are in the area: they are not your target. Docky is in position.'};
