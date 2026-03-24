import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Order "mo:core/Order";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Text "mo:core/Text";

actor {
  type Score = {
    playerName : Text;
    score : Nat;
  };

  module Score {
    public func compare(score1 : Score, score2 : Score) : Order.Order {
      Nat.compare(score2.score, score1.score);
    };
  };

  type Profile = {
    highScore : Nat;
  };

  let profiles = Map.empty<Principal, Profile>();

  public shared ({ caller }) func createProfile() : async () {
    if (profiles.containsKey(caller)) { Runtime.trap("This player already has a profile.") };
    let profile : Profile = { highScore = 0 };
    profiles.add(caller, profile);
  };

  public shared ({ caller }) func submitScore(score : Nat) : async () {
    switch (profiles.get(caller)) {
      case (null) { Runtime.trap("You need to create a profile first!") };
      case (?profile) {
        if (score > profile.highScore) {
          let updatedProfile : Profile = { highScore = score };
          profiles.add(caller, updatedProfile);
        };
      };
    };
  };

  public query ({ caller }) func getMyHighScore() : async Nat {
    switch (profiles.get(caller)) {
      case (null) { Runtime.trap("You need to create a profile first!") };
      case (?profile) { profile.highScore };
    };
  };

  public query func getAllScores() : async [Score] {
    profiles.entries().toArray().map(
      func((principal, profile)) {
        {
          playerName = principal.toText();
          score = profile.highScore;
        };
      }
    ).sort().filter(func(score) { score.score > 0 });
  };

  public query ({ caller }) func isRegistered() : async Bool {
    profiles.containsKey(caller);
  };
};
