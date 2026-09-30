import com.app.dto.custom.*;
import com.app.dao.custom.CustomDAO;
import com.app.service.custom.impl.CustomServiceImpl;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.lang.reflect.*;
import java.util.*;

public class SquadCoordinateCheck {
  public static void main(String[] args) throws Exception {
    var inserted = new ArrayList<CustomSquads>();
    var stored = new CustomTeams(); stored.setCustomTeamId(1L);
    CustomDAO dao = (CustomDAO) Proxy.newProxyInstance(CustomDAO.class.getClassLoader(), new Class[]{CustomDAO.class}, (proxy, method, params) -> {
      switch (method.getName()) {
        case "lockUser": return 1L;
        case "findByUserId": return stored;
        case "findSquads": return new ArrayList<>(inserted);
        case "deleteSquads": inserted.clear(); return null;
        case "insertSquad": inserted.add((CustomSquads) params[0]); return 1;
        default: return null;
      }
    });
    var service = new CustomServiceImpl();
    var field = CustomServiceImpl.class.getDeclaredField("customDAO"); field.setAccessible(true); field.set(service, dao);
    var mapper = new ObjectMapper();
    for (int round = 0; round < 4; round++) {
      var input = new CustomTeams(); input.setTeamName("Coordinate validation");
      var slots = new ArrayList<CustomSquads>();
      for (int i = 0; i < 11; i++) {
        var slot = new CustomSquads(); slot.setPositionNo((long)i + 1);
        slot.setPosition(i < 3 ? "FW" : i < 6 ? "MF" : i < 10 ? "DF" : "GK");
        slot.setPlayerId(i == 10 ? null : (long)(100 * round + i + 1));
        slot.setX(13.2 + round); slot.setY(74.6 - round); slots.add(slot);
      }
      Long first = slots.get(0).getPlayerId(); slots.get(0).setPlayerId(slots.get(9).getPlayerId()); slots.get(9).setPlayerId(first);
      input.setSquads(slots);
      CustomTeams output = service.save(1L, mapper.readValue(mapper.writeValueAsString(input), CustomTeams.class));
      if (output.getSquads().size() != 11) throw new AssertionError("Empty slot coordinates lost");
      for (var slot : output.getSquads()) {
        if (!slot.getX().equals(13.2 + round) || !slot.getY().equals(74.6 - round)) throw new AssertionError("Coordinates lost");
      }
      slots.get(0).setX(101.0);
      try { service.save(1L, input); throw new AssertionError("Invalid coordinate accepted"); }
      catch (IllegalArgumentException expected) { }
    }
    System.out.println("PASS: 4 saves after reshuffling/swapping, JSON coordinates, empty slots, range validation");
  }
}
