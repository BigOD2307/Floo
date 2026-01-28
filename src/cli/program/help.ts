import type { Command } from "commander";
import { formatDocsLink } from "../../terminal/links.js";
import { isRich, theme } from "../../terminal/theme.js";
import { formatCliBannerLine, hasEmittedCliBanner } from "../banner.js";
import type { ProgramContext } from "./context.js";

const EXAMPLES = [
  ["floo channels login --verbose", "Connecte WhatsApp et affiche le QR code."],
  [
    'floo message send --target +225XXXXXXXX --message "Salut" --json',
    "Envoie un message via WhatsApp.",
  ],
  ["floo gateway --port 18789", "Lance le serveur Floo localement."],
  ["floo --dev gateway", "Lance Floo en mode dev (state isole) sur ws://127.0.0.1:19001."],
  ["floo gateway --force", "Redemarre le serveur Floo."],
  [
    'floo agent --to +225XXXXXXXX --message "Resume" --deliver',
    "Parle directement a l'agent IA et envoie la reponse sur WhatsApp.",
  ],
] as const;

export function configureProgramHelp(program: Command, ctx: ProgramContext) {
  program
    .name("floo")
    .description("Floo - Assistant IA personnel pour professionnels africains")
    .version(ctx.programVersion)
    .option("--dev", "Mode dev: isole l'etat sous ~/.floo-dev, port 19001")
    .option("--profile <name>", "Utilise un profil nomme (isole l'etat sous ~/.floo-<name>)");

  program.option("--no-color", "Disable ANSI colors", false);

  program.configureHelp({
    optionTerm: (option) => theme.option(option.flags),
    subcommandTerm: (cmd) => theme.command(cmd.name()),
  });

  program.configureOutput({
    writeOut: (str) => {
      const colored = str
        .replace(/^Usage:/gm, theme.heading("Usage:"))
        .replace(/^Options:/gm, theme.heading("Options:"))
        .replace(/^Commands:/gm, theme.heading("Commands:"));
      process.stdout.write(colored);
    },
    writeErr: (str) => process.stderr.write(str),
    outputError: (str, write) => write(theme.error(str)),
  });

  if (
    process.argv.includes("-V") ||
    process.argv.includes("--version") ||
    process.argv.includes("-v")
  ) {
    console.log(ctx.programVersion);
    process.exit(0);
  }

  program.addHelpText("beforeAll", () => {
    if (hasEmittedCliBanner()) return "";
    const rich = isRich();
    const line = formatCliBannerLine(ctx.programVersion, { richTty: rich });
    return `\n${line}\n`;
  });

  const fmtExamples = EXAMPLES.map(
    ([cmd, desc]) => `  ${theme.command(cmd)}\n    ${theme.muted(desc)}`,
  ).join("\n");

  program.addHelpText("afterAll", ({ command }) => {
    if (command !== program) return "";
    const docs = formatDocsLink("/cli", "docs.floo.africa/cli");
    return `\n${theme.heading("Examples:")}\n${fmtExamples}\n\n${theme.muted("Docs:")} ${docs}\n`;
  });
}
