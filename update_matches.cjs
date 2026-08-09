const fs = require('fs');
const path = require('path');

const filePath = path.join('client', 'src', 'pages', 'matches.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Replacements
content = content.replace(
  `import MatchSquadManager from "@/components/match-squad-manager";`,
  `import MatchSquadManager from "@/components/match-squad-manager";\nimport { useI18n, translateWithParams } from "@/contexts/I18nContext";`
);

content = content.replace(
  `export default function MatchesPage() {`,
  `export default function MatchesPage() {\n  const { t } = useI18n();`
);

content = content.replace(
  `          <h1 className="text-3xl font-bold text-gray-900">Matches &amp; Fixtures</h1>\n          <p className="text-gray-600 mt-1">Manage upcoming matches and review past results</p>`,
  `          <h1 className="text-3xl font-bold text-gray-900">{t("matches.title")}</h1>\n          <p className="text-gray-600 mt-1">{t("matches.description")}</p>`
);

content = content.replace(
  `              Schedule Match\n            </Button>`,
  `              {t("matches.scheduleMatch")}\n            </Button>`
);

content = content.replace(
  `              <DialogTitle>Schedule New Match</DialogTitle>`,
  `              <DialogTitle>{t("matches.scheduleNewMatch")}</DialogTitle>`
);

content = content.replace(
  `            placeholder="Search matches..."`,
  `            placeholder={t("matches.searchPlaceholder")}`
);

content = content.replace(
  `<option value="all">All Matches</option>
          <option value="scheduled">Scheduled</option>
          <option value="ongoing">Ongoing</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="postponed">Postponed</option>`,
  `<option value="all">{t("matches.allMatches")}</option>
          <option value="scheduled">{t("matches.status.scheduled")}</option>
          <option value="ongoing">{t("matches.status.ongoing")}</option>
          <option value="completed">{t("matches.status.completed")}</option>
          <option value="cancelled">{t("matches.status.cancelled")}</option>
          <option value="postponed">{t("matches.status.postponed")}</option>`
);

content = content.replace(
  `            <DialogTitle>Edit Match</DialogTitle>`,
  `            <DialogTitle>{t("matches.editMatch")}</DialogTitle>`
);

content = content.replace(
  `              Match Result\n            </DialogTitle>`,
  `              {t("matches.matchResult")}\n            </DialogTitle>`
);

content = content.replace(
  `            <DialogTitle>Squad — vs {squadMatch?.awayTeam}</DialogTitle>`,
  `            <DialogTitle>{translateWithParams(t, "matches.squadVs", { team: squadMatch?.awayTeam || "" })}</DialogTitle>`
);

content = content.replace(
  `                      <Badge className={\`text-xs \${getStatusColor(match.status)}\`}>\n                        {match.status.charAt(0).toUpperCase() + match.status.slice(1)}\n                      </Badge>\n                      <Badge variant="outline" className="text-xs capitalize">\n                        {match.competition}\n                      </Badge>\n                    </div>\n                    <CardTitle className="text-lg mb-1">\n                      First Team vs {match.awayTeam}\n                    </CardTitle>\n                    <div className="text-sm text-gray-600 capitalize">\n                      {match.matchType} Match\n                    </div>`,
  `                      <Badge className={\`text-xs \${getStatusColor(match.status)}\`}>\n                        {t(\`matches.status.\${match.status}\`) || match.status.charAt(0).toUpperCase() + match.status.slice(1)}\n                      </Badge>\n                      <Badge variant="outline" className="text-xs capitalize">\n                        {match.competition}\n                      </Badge>\n                    </div>\n                    <CardTitle className="text-lg mb-1">\n                      {translateWithParams(t, "matches.firstTeamVs", { team: match.awayTeam })}\n                    </CardTitle>\n                    <div className="text-sm text-gray-600 capitalize">\n                      {translateWithParams(t, "matches.matchType", { type: match.matchType })}\n                    </div>`
);

content = content.replace(
  `                      <p className="text-xs text-gray-400 mt-0.5">Full Time</p>\n\n                      {/* Half-time breakdown */}\n                      {match.firstHalfHomeScore !== null &&\n                        match.firstHalfAwayScore !== null && (\n                          <p className="text-xs text-gray-500 mt-1">\n                            HT {match.firstHalfHomeScore}–{match.firstHalfAwayScore}\n                            {match.secondHalfHomeScore !== null &&\n                              match.secondHalfAwayScore !== null && (\n                                <span>\n                                  &nbsp;| 2H {match.secondHalfHomeScore}–{match.secondHalfAwayScore}\n                                </span>\n                              )}\n                          </p>\n                        )}`,
  `                      <p className="text-xs text-gray-400 mt-0.5">{t("matches.fullTime")}</p>\n\n                      {/* Half-time breakdown */}\n                      {match.firstHalfHomeScore !== null &&\n                        match.firstHalfAwayScore !== null && (\n                          <p className="text-xs text-gray-500 mt-1">\n                            {t("matches.ht")} {match.firstHalfHomeScore}–{match.firstHalfAwayScore}\n                            {match.secondHalfHomeScore !== null &&\n                              match.secondHalfAwayScore !== null && (\n                                <span>\n                                  &nbsp;| {t("matches.secondHalf")} {match.secondHalfHomeScore}–{match.secondHalfAwayScore}\n                                </span>\n                              )}\n                          </p>\n                        )}`
);

content = content.replace(
  `                    <span>Attendance: {match.attendance.toLocaleString()}</span>`,
  `                    <span>{translateWithParams(t, "matches.attendance", { attendance: match.attendance.toLocaleString() })}</span>`
);

content = content.replace(
  `                    Weather: {match.weatherConditions}`,
  `                    {translateWithParams(t, "matches.weather", { weather: match.weatherConditions })}`
);

content = content.replace(
  `                    Edit\n                  </Button>`,
  `                    {t("matches.edit")}\n                  </Button>`
);

content = content.replace(
  `                      Result\n                    </Button>`,
  `                      {t("matches.result")}\n                    </Button>`
);

content = content.replace(
  `                      Squad\n                    </Button>`,
  `                      {t("matches.squad")}\n                    </Button>`
);

content = content.replace(
  `            <h3 className="text-lg font-medium text-gray-900 mb-2">No matches found</h3>\n            <p className="text-gray-600 mb-4">\n              {searchTerm || selectedStatus !== "all"\n                ? "Try adjusting your search or filter criteria."\n                : "Get started by scheduling your first match."}\n            </p>\n            {!searchTerm && selectedStatus === "all" && (\n              <Button onClick={() => setIsScheduleOpen(true)}>\n                <Plus className="w-4 h-4 mr-2" />\n                Schedule Match\n              </Button>`,
  `            <h3 className="text-lg font-medium text-gray-900 mb-2">{t("matches.noMatches")}</h3>\n            <p className="text-gray-600 mb-4">\n              {searchTerm || selectedStatus !== "all"\n                ? t("matches.noSearchResults")\n                : t("matches.getStarted")}\n            </p>\n            {!searchTerm && selectedStatus === "all" && (\n              <Button onClick={() => setIsScheduleOpen(true)}>\n                <Plus className="w-4 h-4 mr-2" />\n                {t("matches.scheduleMatch")}\n              </Button>`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Matches page updated');
