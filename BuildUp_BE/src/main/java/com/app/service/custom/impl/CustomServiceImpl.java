package com.app.service.custom.impl;

import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;
import java.nio.charset.StandardCharsets;
import java.util.HashSet;
import java.util.Set;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.Collections;
import java.util.Locale;
import java.util.concurrent.ThreadLocalRandom;
import java.time.LocalDateTime;
import com.app.dao.team.TeamDAO;
import com.app.dto.team.Players;
import com.app.dto.team.Teams;
import com.app.dto.custom.AiMatches;
import com.app.dto.custom.AiMatches.*;
import com.app.dao.custom.CustomDAO;
import com.app.dto.custom.CustomTeams;
import com.app.dto.custom.CustomSquads;

import com.app.service.custom.CustomService;

@Service
public class CustomServiceImpl implements CustomService {
    @Autowired
    private CustomDAO customDAO;
    @Autowired
    private TeamDAO teamDAO;

    private static final List<Formation> AI_FORMATIONS = List.of(
        new Formation("4-3-3", 4, 3, 3), new Formation("4-4-2", 4, 4, 2),
        new Formation("3-5-2", 3, 5, 2), new Formation("3-4-3", 3, 4, 3),
        new Formation("4-2-3-1", 4, 5, 1), new Formation("5-3-2", 5, 3, 2),
        new Formation("5-4-1", 5, 4, 1), new Formation("4-1-4-1", 4, 5, 1),
        new Formation("5-2-3", 5, 2, 3));
    private static final Set<String> POSITIONS = Set.of("GK", "DF", "MF", "FW");
    private static final Set<Long> EXCLUDED_TEAMS = Set.of(338L, 340L, 328L, 76L, 563L);

    @Override
    @Transactional(readOnly = true)
    public AiMatches playAiMatch(AiMatches.Request request) {
        if (request == null || request.getSquads() == null || request.getSquads().size() != 11)
            throw new IllegalArgumentException("서로 다른 선수 11명을 배치해주세요.");
        String homeName = request.getTeamName() == null ? "" : request.getTeamName().trim();
        if (homeName.isEmpty()) homeName = "나만의 드림 스쿼드";
        if (homeName.length() > 100) throw new IllegalArgumentException("팀 이름이 너무 깁니다.");
        Set<Long> playerIds = new HashSet<>();
        Set<Long> slotNumbers = new HashSet<>();
        int df = 0, mf = 0, fw = 0, gk = 0;
        for (CustomSquads slot : request.getSquads()) {
            if (slot == null || slot.getPlayerId() == null || slot.getPlayerId() <= 0 || !playerIds.add(slot.getPlayerId())
                    || slot.getPositionNo() == null || slot.getPositionNo() < 1 || slot.getPositionNo() > 11
                    || !slotNumbers.add(slot.getPositionNo()) || !POSITIONS.contains(slot.getPosition() == null ? "" : slot.getPosition()))
                throw new IllegalArgumentException("선수, 배치 포지션, 슬롯 번호를 확인해주세요.");
            switch (slot.getPosition()) {
                case "DF": df++; break;
                case "MF": mf++; break;
                case "FW": fw++; break;
                default: gk++;
            }
        }
        if (gk != 1 || df + mf + fw != 10) throw new IllegalArgumentException("GK 자리 1개와 필드 자리 10개가 필요합니다.");
        String homeFormation = df + "-" + mf + "-" + fw;
        for (Formation preset : AI_FORMATIONS) {
            if (preset.getLabel().equals(request.getPresetLabel()) && preset.getDf() == df && preset.getMf() == mf && preset.getFw() == fw)
                homeFormation = preset.getLabel();
        }
        Map<Long, Teams> clubs = new HashMap<>();
        for (Teams team : teamDAO.findAllTeams()) {
            if (!isExcludedClub(team)) clubs.put(team.getTeamId(), team);
        }
        Long opponentId = request.getOpponentTeamId();
        if (opponentId != null && !clubs.containsKey(opponentId)) throw new IllegalArgumentException("선택 가능한 상대 구단이 아닙니다.");
        Map<Long, MatchPlayer> players = new HashMap<>();
        for (Players player : teamDAO.findAllPlayers()) {
            Teams club = clubs.get(player.getTeamId());
            if (club == null || player.getPlayerId() == null || !POSITIONS.contains(player.getMainPosition() == null ? "" : player.getMainPosition())) continue;
            MatchPlayer copy = new MatchPlayer();
            copy.setPlayerId(player.getPlayerId()); copy.setName(player.getName()); copy.setNameKor(player.getNameKor());
            copy.setMainPosition(player.getMainPosition()); copy.setDetailPosition(player.getDetailPosition()); copy.setTeamId(player.getTeamId());
            copy.setTeamName(club.getTeamName()); copy.setTeamNameKor(club.getTeamNameKor()); copy.setTeamEmblem(club.getEmblemUrl());
            players.put(copy.getPlayerId(), copy);
        }
        List<LineupSlot> home = new ArrayList<>();
        List<CustomSquads> slots = new ArrayList<>(request.getSquads());
        slots.sort(Comparator.comparing(CustomSquads::getPositionNo));
        for (CustomSquads slot : slots) {
            MatchPlayer player = players.get(slot.getPlayerId());
            if (player == null) throw new IllegalArgumentException("DB에서 사용할 수 없는 선수가 포함되어 있습니다. 선수 명단을 새로고침해주세요.");
            home.add(new LineupSlot(slot.getPosition(), player));
        }
        Opponent opponent = createOpponent(new ArrayList<>(players.values()), opponentId);
        AiMatches result = simulateMatch(home, opponent.getLineup());
        result.setHomeName(homeName); result.setHomeFormation(homeFormation); result.setHome(home); result.setOpponent(opponent);
        Teams club = clubs.get(opponentId);
        result.setOpponentName(club == null ? "AI 팀" : club.getTeamNameKor() != null ? club.getTeamNameKor() : club.getTeamName());
        result.setCreatedAt(LocalDateTime.now());
        return result;
    }

    private boolean isExcludedClub(Teams team) {
        if (team.getTeamId() == null || EXCLUDED_TEAMS.contains(team.getTeamId())) return true;
        String name = (String.valueOf(team.getTeamName()) + " " + String.valueOf(team.getTeamNameKor())).toLowerCase(Locale.ROOT);
        return List.of("레스터", "사우샘프턴", "번리", "울버햄튼", "웨스트햄", "leicester", "southampton", "burnley", "wolverhampton", "west ham")
            .stream().anyMatch(name::contains);
    }

    private Opponent createOpponent(List<MatchPlayer> players, Long teamId) {
        Map<String, List<MatchPlayer>> pools = new HashMap<>();
        POSITIONS.forEach(pos -> pools.put(pos, new ArrayList<>()));
        for (MatchPlayer player : players) {
            if (teamId == null || teamId.equals(player.getTeamId())) pools.get(player.getMainPosition()).add(player);
        }
        List<Formation> choices = AI_FORMATIONS.stream().filter(f -> pools.get("GK").size() >= 1
            && pools.get("DF").size() >= f.getDf() && pools.get("MF").size() >= f.getMf() && pools.get("FW").size() >= f.getFw()).toList();
        if (choices.isEmpty()) throw new IllegalArgumentException("상대 팀을 구성할 포지션별 선수가 부족합니다.");
        Formation formation = choices.get(ThreadLocalRandom.current().nextInt(choices.size()));
        List<LineupSlot> lineup = new ArrayList<>();
        String[] positions = {"GK", "DF", "MF", "FW"};
        int[] counts = {1, formation.getDf(), formation.getMf(), formation.getFw()};
        for (int i = 0; i < positions.length; i++) {
            List<MatchPlayer> pool = pools.get(positions[i]);
            Collections.shuffle(pool, ThreadLocalRandom.current());
            for (int j = 0; j < counts[i]; j++) lineup.add(new LineupSlot(positions[i], pool.get(j)));
        }
        return new Opponent(new Formation(formation.getLabel(), formation.getDf(), formation.getMf(), formation.getFw()), lineup);
    }

    private PositionPenalty positionPenalty(List<LineupSlot> lineup, boolean ai) {
        PositionPenalty p = new PositionPenalty();
        int fw = 0, mf = 0, df = 0, gk = 0;
        for (LineupSlot slot : lineup) {
            if (slot.getPos().equals(slot.getPlayer().getMainPosition())) continue;
            switch (slot.getPos()) { case "FW": fw++; break; case "MF": mf++; break; case "DF": df++; break; default: gk++; }
        }
        int count = fw + mf + df + gk;
        boolean all = lineup.size() >= 11 && count == lineup.size();
        boolean synergy = !ai && lineup.size() >= 11 && count == 0;
        int f = Math.min(fw * 15, 60), m = Math.min(mf * 12, 50), d = Math.min(df * 12, 50), g = gk > 0 ? 75 : 0;
        if (all) { f = Math.min(f + 25, 85); m = Math.min(m + 25, 75); d = Math.min(d + 25, 75); g = Math.min(g + 15, 90); }
        p.setIsAi(ai); p.setTotalPlayers(lineup.size()); p.setMismatchCount(count); p.setIsAllMismatch(all); p.setIsPerfectSynergy(synergy);
        p.setSynergyBuffPercent(synergy ? 20 : 0);
        p.setFwMismatchCount(fw); p.setMfMismatchCount(mf); p.setDfMismatchCount(df); p.setGkMismatchCount(gk);
        p.setFwPenaltyPercent(f); p.setMfPenaltyPercent(m); p.setDfPenaltyPercent(d); p.setGkPenaltyPercent(g);
        p.setGoalRateMultiplier(synergy ? 1.2 : Math.max(0.15, 1 - f / 100.0));
        p.setPassRateMultiplier(synergy ? 1.2 : Math.max(0.2, 1 - m / 100.0));
        p.setDefenseEfficiencyMultiplier(synergy ? 1.25 : Math.max(0.2, 1 - d / 100.0));
        p.setSaveRateMultiplier(synergy ? 1.15 : gk > 0 ? (all ? 0.10 : 0.25) : 1.0);
        return p;
    }

    private String playerName(MatchPlayer player) {
        return player.getNameKor() == null || player.getNameKor().isBlank() ? player.getName() : player.getNameKor();
    }

    private void addMatchEvent(AiMatches match, List<Set<Long>> dismissed, int minute, Integer side,
            String type, String label, String description, boolean goal) {
        if (goal) match.getScore()[side]++;
        Event event = new Event();
        event.setMinute(minute); event.setSide(side); event.setType(type); event.setLabel(label); event.setDescription(description);
        event.setIsGoal(goal); event.setScore(match.getScore().clone());
        event.setDismissedHomeIds(new ArrayList<>(dismissed.get(0))); event.setDismissedAiIds(new ArrayList<>(dismissed.get(1)));
        match.getEvents().add(event);
    }

    private AiMatches simulateMatch(List<LineupSlot> home, List<LineupSlot> away) {
        AiMatches result = new AiMatches();
        result.setScore(new int[]{0, 0}); result.setEvents(new ArrayList<>());
        result.setPositionPenalties(List.of(positionPenalty(home, false), positionPenalty(away, true)));
        List<List<LineupSlot>> teams = List.of(home, away);
        List<Set<Long>> booked = List.of(new HashSet<>(), new HashSet<>());
        List<Set<Long>> dismissed = List.of(new HashSet<>(), new HashSet<>());
        ThreadLocalRandom random = ThreadLocalRandom.current();
        addMatchEvent(result, dismissed, 0, null, "period", "킥오프", "전반전이 시작됩니다.", false);
        for (int side = 0; side < 2; side++) {
            PositionPenalty p = result.getPositionPenalties().get(side);
            String name = side == 0 ? "우리 팀" : "상대 팀";
            if (p.getIsPerfectSynergy()) addMatchEvent(result, dismissed, 1, side, "period", "시너지 버프 발동", "🔥 " + name + "은 11명 전원 포지션 일치! 골 결정력·패스 +20%, 수비 +25%, 선방 +15%가 적용됩니다.", false);
            else if (p.getIsAllMismatch()) addMatchEvent(result, dismissed, 1, side, "yellow", "전술 붕괴 디버프", "🚨 " + name + "은 11명 전원이 원래 포지션과 다릅니다! 조직력 와해로 추가 페널티가 적용됩니다.", false);
        }
        for (int minute = 1; minute <= 90; minute++) {
            for (int side = 0; side < 2; side++) {
                int other = 1 - side;
                Set<Long> myDismissed = dismissed.get(side), theirDismissed = dismissed.get(other);
                List<LineupSlot> lineup = teams.get(side).stream().filter(s -> !myDismissed.contains(s.getPlayer().getPlayerId())).toList();
                List<LineupSlot> opponents = teams.get(other).stream().filter(s -> !theirDismissed.contains(s.getPlayer().getPlayerId())).toList();
                if (lineup.isEmpty() || opponents.isEmpty()) continue;
                PositionPenalty mine = result.getPositionPenalties().get(side), theirs = result.getPositionPenalties().get(other);
                if (random.nextDouble() >= 0.11 + (1 - theirs.getDefenseEfficiencyMultiplier()) * 0.08) continue;
                if (mine.getMfMismatchCount() > 0 && random.nextDouble() > mine.getPassRateMultiplier()) {
                    LineupSlot passer = lineup.stream().filter(s -> "MF".equals(s.getPos()) && !"MF".equals(s.getPlayer().getMainPosition())).findFirst().orElse(lineup.get(0));
                    addMatchEvent(result, dismissed, minute, side, "miss", "패스 실패", playerName(passer.getPlayer()) + "의 패스가 차단됩니다. (MF 포지션 불일치로 패스 확률 " + mine.getMfPenaltyPercent() + "% 감소)", false);
                    continue;
                }
                List<LineupSlot> attackers = lineup.stream().filter(s -> "FW".equals(s.getPos()) || "MF".equals(s.getPos())).toList();
                List<LineupSlot> candidates = attackers.isEmpty() ? lineup : attackers;
                LineupSlot shooter = candidates.get(random.nextInt(candidates.size()));
                String name = playerName(shooter.getPlayer());
                boolean fwMismatch = "FW".equals(shooter.getPos()) && !"FW".equals(shooter.getPlayer().getMainPosition());
                double goalMultiplier = mine.getGoalRateMultiplier() * (fwMismatch ? 0.7 : 1.0);
                double kind = random.nextDouble();
                if (kind < 0.13) {
                    boolean goal = random.nextDouble() < 0.45 * goalMultiplier;
                    String description = goal ? name + "의 감각적인 슈팅이 골망을 흔듭니다!" + (mine.getIsPerfectSynergy() ? " (팀 시너지 버프!)" : "")
                        : fwMismatch ? name + "의 슈팅이 빗맞아 골문을 벗어납니다. (FW 포지션 불일치로 골 확률 " + mine.getFwPenaltyPercent() + "% 감소)"
                        : name + "의 위협적인 슈팅이 골대를 아슬아슬하게 스쳐 지나갑니다.";
                    addMatchEvent(result, dismissed, minute, side, goal ? "goal" : "miss", goal ? "골" : "슈팅 실패", description, goal);
                } else if (kind < 0.21) {
                    addMatchEvent(result, dismissed, minute, side, "penalty", "PK 선언", name + (theirs.getDfMismatchCount() > 0 ? "의 돌파를 저지하던 상대 수비진의 포지션 부적응 파울! 페널티킥이 선언됩니다." : "의 돌파 중 페널티 지역 안에서 파울! 페널티킥이 선언됩니다."), false);
                    boolean goal = random.nextDouble() < 0.75 * goalMultiplier;
                    addMatchEvent(result, dismissed, minute, side, goal ? "goal" : "miss", goal ? "PK 성공" : "PK 실패", name + (goal ? "이 침착하게 페널티킥을 성공시킵니다!" : "의 페널티킥이 실축됩니다!"), goal);
                } else if (kind < 0.38) {
                    addMatchEvent(result, dismissed, minute, side, "offside", "오프사이드", name + "의 침투에 오프사이드가 선언되어 공격이 중단됩니다.", false);
                } else if (kind < 0.54) {
                    addMatchEvent(result, dismissed, minute, side, "free-kick", "프리킥", "좋은 위치에서 얻은 프리킥을 " + name + "이 직접 노립니다.", false);
                    boolean goal = random.nextDouble() < 0.11 * goalMultiplier;
                    addMatchEvent(result, dismissed, minute, side, goal ? "goal" : "miss", goal ? "프리킥 골" : "프리킥 실패", name + (goal ? "의 직접 프리킥이 골문 구석으로 빨려들어갑니다!" : "의 프리킥이 수비벽에 막힙니다."), goal);
                } else if (kind < 0.73) {
                    LineupSlot keeper = opponents.stream().filter(s -> "GK".equals(s.getPos())).findFirst().orElse(opponents.get(0));
                    boolean mismatch = "GK".equals(keeper.getPos()) && !"GK".equals(keeper.getPlayer().getMainPosition());
                    double base = mismatch ? (theirs.getIsAllMismatch() ? 0.10 : 0.22) : 0.85;
                    if (random.nextDouble() < base * theirs.getSaveRateMultiplier()) {
                        addMatchEvent(result, dismissed, minute, other, "save", "선방", playerName(keeper.getPlayer()) + "이 " + name + "의 결정적인 슈팅을 몸을 던져 막아냅니다!", false);
                    } else {
                        addMatchEvent(result, dismissed, minute, side, "goal", "골", mismatch ? name + "의 슈팅을 " + playerName(keeper.getPlayer()) + "(전문 GK 아님)이 쳐내지 못하고 실점합니다! (GK 선방 확률 " + theirs.getGkPenaltyPercent() + "% 감소)" : name + "의 날카로운 슈팅이 골키퍼를 뚫고 골이 됩니다!", true);
                    }
                } else if (kind < 0.87) {
                    addMatchEvent(result, dismissed, minute, side, "corner", "코너킥", name + "의 코너킥 크로스를 상대 수비가 걷어냅니다.", false);
                } else {
                    MatchPlayer offender = lineup.get(random.nextInt(lineup.size())).getPlayer();
                    boolean direct = kind >= 0.985;
                    if (direct || booked.get(side).contains(offender.getPlayerId())) {
                        dismissed.get(side).add(offender.getPlayerId());
                        addMatchEvent(result, dismissed, minute, side, "red", direct ? "직접 퇴장" : "경고 누적 퇴장", playerName(offender) + (direct ? "이 거친 태클로 바로 레드카드를 받습니다" : "이 두 번째 옐로카드를 받아 퇴장합니다") + ". 남은 선수 " + (lineup.size() - 1) + "명.", false);
                    } else {
                        booked.get(side).add(offender.getPlayerId());
                        addMatchEvent(result, dismissed, minute, side, "yellow", "경고", playerName(offender) + "이 거친 태클로 옐로카드를 받습니다.", false);
                    }
                }
            }
            if (minute == 45) {
                addMatchEvent(result, dismissed, 45, null, "period", "하프타임", "전반전이 종료되었습니다.", false);
                addMatchEvent(result, dismissed, 46, null, "period", "후반 시작", "후반전이 시작됩니다.", false);
            }
        }
        addMatchEvent(result, dismissed, 90, null, "period", "경기 종료", "주심이 경기 종료 휘슬을 붑니다.", false);
        result.setHomeScore((long) result.getScore()[0]); result.setAwayScore((long) result.getScore()[1]);
        return result;
    }

    @Override
    @Transactional
    public CustomTeams findByUserId(Long userId) {
        if (customDAO.lockUser(userId) == null) throw new IllegalArgumentException("회원을 찾을 수 없습니다.");
        CustomTeams team = customDAO.findByUserId(userId);
        if (team != null) team.setSquads(customDAO.findSquads(team.getCustomTeamId()));
        return team;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public CustomTeams save(Long userId, CustomTeams team) {
        if (team == null || team.getTeamName() == null || team.getTeamName().isBlank())
            throw new IllegalArgumentException("스쿼드 이름을 입력해주세요.");
        team.setTeamName(team.getTeamName().trim());
        if (team.getTeamName().getBytes(StandardCharsets.UTF_8).length > 100)
            throw new IllegalArgumentException("스쿼드 이름은 UTF-8 기준 100바이트 이내로 입력해주세요.");
        if (team.getSquads() == null || team.getSquads().size() != 11)
            throw new IllegalArgumentException("배치 슬롯은 11개여야 합니다.");
        Set<Long> positions = new HashSet<>();
        Set<Long> players = new HashSet<>();
        int df = 0, mf = 0, fw = 0, gk = 0;
        for (CustomSquads squad : team.getSquads()) {
            if (squad == null || squad.getPositionNo() == null || squad.getPositionNo() < 1 || squad.getPositionNo() > 11
                    || !positions.add(squad.getPositionNo())) throw new IllegalArgumentException("슬롯 번호는 중복 없이 1~11이어야 합니다.");
            String pos = squad.getPosition();
            if ("DF".equals(pos)) df++;
            else if ("MF".equals(pos)) mf++;
            else if ("FW".equals(pos)) fw++;
            else if ("GK".equals(pos)) gk++;
            else throw new IllegalArgumentException("잘못된 배치 포지션입니다.");
            if (squad.getPlayerId() != null && (squad.getPlayerId() <= 0 || !players.add(squad.getPlayerId())))
                throw new IllegalArgumentException("선수를 중복 배치할 수 없습니다.");
        }
        if (gk != 1 || df + mf + fw != 10) throw new IllegalArgumentException("GK 1개와 필드 슬롯 10개가 필요합니다.");
        for (CustomSquads squad : team.getSquads()) {
            long no = squad.getPositionNo();
            String expected = no <= fw ? "FW" : no <= fw + mf ? "MF" : no <= fw + mf + df ? "DF" : "GK";
            if (!expected.equals(squad.getPosition())) throw new IllegalArgumentException("슬롯은 FW, MF, DF, GK 순서여야 합니다.");
        }
        team.setFormation(df + "-" + mf + "-" + fw);
        team.setUserId(userId);
        if (customDAO.lockUser(userId) == null) throw new IllegalArgumentException("회원을 찾을 수 없습니다.");
        CustomTeams existing = customDAO.findByUserId(userId);
        if (existing == null) {
            team.setCustomTeamId(null);
            customDAO.insertTeam(team);
            team.setCustomTeamId(customDAO.findByUserId(userId).getCustomTeamId());
        } else {
            team.setCustomTeamId(existing.getCustomTeamId());
            customDAO.updateTeam(team);
            customDAO.deleteSquads(team.getCustomTeamId());
        }
        for (CustomSquads squad : team.getSquads()) {
            if (squad.getPlayerId() == null) continue;
            squad.setCustomTeamId(team.getCustomTeamId());
            if (customDAO.insertSquad(squad) != 1) throw new IllegalArgumentException("DB에 등록되지 않은 선수가 포함되어 있습니다.");
        }
        CustomTeams saved = customDAO.findByUserId(userId);
        saved.setSquads(customDAO.findSquads(saved.getCustomTeamId()));
        return saved;
    }

}
