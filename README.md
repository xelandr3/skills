# skills

Agent skills by [Xelandre (@xelandre__)](https://x.com/xelandre__), for Claude Code and any agent that reads the open Agent Skills format.

## Skills

| Skill | What it does | Status |
|---|---|---|
| [code-typing-videos](plugins/code-typing-videos) | Turns lyrics or a short text into a vertical video where the text is typed as code in extreme close-up, with 2012 frag-movie energy. | Work in progress: the rendering engine is not included yet |

## Install

### Claude Code

Add this repository as a plugin marketplace, then install the skills you want:

```bash
claude plugin marketplace add xelandr3/skills
claude plugin install code-typing-videos@xelandre-skills
```

### Other agents

Each skill is a folder with a `SKILL.md`, under `plugins/<name>/skills/<name>/`. Copy that folder into your agent's skills folder.

## License

MIT, see [LICENSE](LICENSE). Bundled fonts keep their own licenses, listed in each skill.
