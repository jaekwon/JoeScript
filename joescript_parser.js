var CodeStream = require('./codestream').CodeStream;
grammar0 = {};
code0 = CodeStream("func foo, bar");
console.log("parsing code:");
var matches0, pos0, pos1, res1, results1, resV0, res0, resJ0, pos2, result0, results0, pos3, pos4, pos5, pos6, pos7, res2, pos8, pos9, pos10, pos11, temp0, temp1, temp2, temp3, temp4, temp5, temp6, temp7, temp8, temp9, temp10, temp11, temp12, temp13, temp14, temp15, temp16, temp17, temp18, temp19, temp20, temp21, temp22, temp23, temp24, temp25, temp26, temp27, temp28, temp29, temp30, temp31, temp32, temp33, temp34, temp35, temp36, temp37, temp38, temp39, temp40, temp41, temp42, temp43, temp44, temp45, temp46, temp47, temp48, temp49, temp50, temp51, temp52, temp53, temp54, temp55, temp56, temp57, temp58, temp59, temp60, temp61, temp62, temp63, temp64, temp65, temp66, temp67, temp68, temp69, temp70, temp71, temp72, temp73, temp74, temp75, temp76, temp77, temp78, temp79, temp80, temp81, temp82, temp83, temp84, temp85, temp86, temp87, temp88, temp89, temp90, temp91, temp92, temp93, temp94, temp95, temp96, temp97, temp98, temp99, temp100, temp101, temp102, temp103, temp104, temp105, temp106, temp107, temp108, temp109, temp110, temp111, temp112, temp113, temp114, temp115, temp116, temp117, temp118, temp119, temp120, temp121, temp122, temp123, temp124, temp125, temp126, temp127, temp128, temp129, temp130, temp131, temp132, temp133, temp134, temp135, temp136, temp137, temp138, temp139, temp140, temp141, temp142, temp143, temp144, temp145, temp146, temp147, temp148, temp149, temp150, temp151, temp152, temp153, temp154, temp155, temp156, temp157, temp158, temp159, temp160, temp161, temp162, temp163, temp164, temp165, temp166, temp167, temp168, temp169, temp170, temp171, temp172, temp173, temp174, temp175, temp176, temp177, temp178, temp179, temp180, temp181, temp182, temp183, temp184, temp185, temp186, temp187, temp188, temp189, temp190, temp191, temp192, temp193, temp194, temp195, temp196, temp197, temp198, temp199, temp200, temp201, temp202, temp203, temp204, temp205, temp206, temp207, temp208, temp209, temp210, temp211, temp212, temp213, temp214, temp215, temp216, temp217, temp218, temp219, temp220, temp221, temp222, temp223, temp224, temp225, temp226, temp227, temp228, temp229, temp230, temp231, temp232, temp233, temp234, temp235, temp236, temp237, temp238, temp239, temp240, temp241, temp242, temp243, temp244, temp245, temp246, temp247, temp248, temp249, temp250, temp251, temp252, temp253, temp254, temp255, temp256, temp257, temp258, temp259, temp260, temp261, temp262, temp263, temp264, temp265, temp266, temp267, temp268, temp269, temp270, temp271, temp272, temp273, temp274, temp275, temp276, temp277, temp278, temp279, temp280, temp281, temp282, temp283, temp284, temp285, temp286, temp287, temp288, temp289, temp290, temp291, temp292, temp293, temp294, temp295, temp296, temp297, temp298, temp299, temp300, temp301, temp302, temp303, temp304, temp305, temp306, temp307, temp308, temp309, temp310, temp311, temp312, temp313, temp314, temp315, temp316, temp317, temp318, temp319, temp320, temp321, temp322, temp323, temp324, temp325, temp326, temp327, temp328, temp329, temp330, temp331, temp332, temp333, temp334, temp335, temp336, temp337, temp338;
grammar0["INVOC_IMPL"] = function() {
  while(true) {
    matches0 = [];
    pos0 = code0.pos;
    outer:
    while(true) {
      while(true) {
        pos1 = code0.pos;
        temp0 = {
        };
        code0.match(temp0);
        if((res1 === null)) {
          res1 = undefined;
          code0.pos = pos1;
        }
        if((res1 === null)) {
          break;
        } else {
          results1 = _.extend(res1, results1);
        }
        if((res1 === null)) {
          break;
        } else {
          results1["splat"] = res1;
        }
        resV0 = results1;
        break;
      }
      if((resV0 === null)) {
        res0 = null;
        break outer;
      }
      matches0.push(resV0);
      inner:
      while(true) {
        pos1 = code0.pos;
        while(true) {
          resJ0 = null;
          pos2 = code0.pos;
          resJ0 = grammar0["_COMMA"]();
          if((resJ0 === null)) {
            code0.pos = pos2;
          } else {
            break;
          }
          pos2 = code0.pos;
          resJ0 = grammar0["_COMMA_NEWLINE"]();
          if((resJ0 === null)) {
            code0.pos = pos2;
          } else {
            break;
          }
          break;
        }
        if((resJ0 === null)) {
          code0.pos = pos1;
          break inner;
        }
        while(true) {
          pos2 = code0.pos;
          temp1 = {
          };
          code0.match(temp1);
          if((res1 === null)) {
            res1 = undefined;
            code0.pos = pos2;
          }
          if((res1 === null)) {
            break;
          } else {
            results1 = _.extend(res1, results1);
          }
          if((res1 === null)) {
            break;
          } else {
            results1["splat"] = res1;
          }
          resV0 = results1;
          break;
        }
        if((resV0 === null)) {
          code0.pos = pos1;
          break inner;
        }
        matches0.push(resV0);
      }
      if((1 > matches0.length)) {
        res0 = null;
        code0.pos = pos0;
        break outer;
      }
      break outer;
    }
    res0 = matches0;
    if((res0 === null)) {
      break;
    }
    if((res0 === null)) {
      break;
    } else {
      results0["params"] = res0;
    }
    result0 = results0;
    break;
  }
  return result0;
};
grammar0["OBJ_IMPL_INDENTED"] = function() {
  while(true) {
    matches0 = [];
    pos0 = code0.pos;
    outer:
    while(true) {
      resV0 = grammar0["OBJ_IMPL_ITEM"]();
      if((resV0 === null)) {
        res0 = null;
        break outer;
      }
      matches0.push(resV0);
      inner:
      while(true) {
        pos1 = code0.pos;
        while(true) {
          resJ0 = null;
          pos2 = code0.pos;
          resJ0 = grammar0["_COMMA"]();
          if((resJ0 === null)) {
            code0.pos = pos2;
          } else {
            break;
          }
          pos2 = code0.pos;
          resJ0 = grammar0["_NEWLINE"]();
          if((resJ0 === null)) {
            code0.pos = pos2;
          } else {
            break;
          }
          break;
        }
        if((resJ0 === null)) {
          code0.pos = pos1;
          break inner;
        }
        resV0 = grammar0["OBJ_IMPL_ITEM"]();
        if((resV0 === null)) {
          code0.pos = pos1;
          break inner;
        }
        matches0.push(resV0);
      }
      if((1 > matches0.length)) {
        res0 = null;
        code0.pos = pos0;
        break outer;
      }
      break outer;
    }
    res0 = matches0;
    result0 = res0;
    if((res0 === null)) {
      result0 = null;
      break;
    }
    break;
  }
  return result0;
};
grammar0["OBJ_IMPL"] = function() {
  while(true) {
    matches0 = [];
    pos0 = code0.pos;
    outer:
    while(true) {
      resV0 = grammar0["OBJ_IMPL_ITEM"]();
      if((resV0 === null)) {
        res0 = null;
        break outer;
      }
      matches0.push(resV0);
      inner:
      while(true) {
        pos1 = code0.pos;
        while(true) {
          resJ0 = null;
          pos2 = code0.pos;
          resJ0 = grammar0["_COMMA"]();
          if((resJ0 === null)) {
            code0.pos = pos2;
          } else {
            break;
          }
          pos2 = code0.pos;
          resJ0 = grammar0["_NEWLINE"]();
          if((resJ0 === null)) {
            code0.pos = pos2;
          } else {
            break;
          }
          break;
        }
        if((resJ0 === null)) {
          code0.pos = pos1;
          break inner;
        }
        resV0 = grammar0["OBJ_IMPL_ITEM"]();
        if((resV0 === null)) {
          code0.pos = pos1;
          break inner;
        }
        matches0.push(resV0);
      }
      if((1 > matches0.length)) {
        res0 = null;
        code0.pos = pos0;
        break outer;
      }
      break outer;
    }
    res0 = matches0;
    result0 = res0;
    if((res0 === null)) {
      result0 = null;
      break;
    }
    break;
  }
  return result0;
};
grammar0["OBJ_IMPL_ITEM"] = function() {
  while(true) {
    result0 = undefined;
    results0 = {
    };
    while(true) {
      res0 = null;
      pos0 = code0.pos;
      res0 = grammar0["WORD"]();
      if((res0 === null)) {
        code0.pos = pos0;
      } else {
        break;
      }
      pos0 = code0.pos;
      res0 = grammar0["STRING"]();
      if((res0 === null)) {
        code0.pos = pos0;
      } else {
        break;
      }
      break;
    }
    if((res0 === null)) {
      break;
    } else {
      results0["key"] = res0;
    }
    res0 = grammar0["_"]();
    if((res0 === null)) {
      break;
    }
    temp2 = {
    };
    code0.match(temp2);
    if((res0 === null)) {
      break;
    }
    res0 = grammar0["EXPR"]();
    if((res0 === null)) {
      break;
    } else {
      results0["value"] = res0;
    }
    result0 = results0;
    break;
  }
  return result0;
};
grammar0["ASSIGN"] = function() {
  while(true) {
    result0 = undefined;
    results0 = {
    };
    res0 = grammar0["ASSIGNABLE"]();
    if((res0 === null)) {
      break;
    } else {
      results0["target"] = res0;
    }
    res0 = grammar0["_"]();
    if((res0 === null)) {
      break;
    }
    while(true) {
      res0 = null;
      pos0 = code0.pos;
      temp3 = {
      };
      code0.match(temp3);
      if((res0 === null)) {
        code0.pos = pos0;
      } else {
        break;
      }
      pos0 = code0.pos;
      temp4 = {
      };
      code0.match(temp4);
      if((res0 === null)) {
        code0.pos = pos0;
      } else {
        break;
      }
      pos0 = code0.pos;
      temp5 = {
      };
      code0.match(temp5);
      if((res0 === null)) {
        code0.pos = pos0;
      } else {
        break;
      }
      pos0 = code0.pos;
      temp6 = {
      };
      code0.match(temp6);
      if((res0 === null)) {
        code0.pos = pos0;
      } else {
        break;
      }
      pos0 = code0.pos;
      temp7 = {
      };
      code0.match(temp7);
      if((res0 === null)) {
        code0.pos = pos0;
      } else {
        break;
      }
      pos0 = code0.pos;
      temp8 = {
      };
      code0.match(temp8);
      if((res0 === null)) {
        code0.pos = pos0;
      } else {
        break;
      }
      pos0 = code0.pos;
      temp9 = {
      };
      code0.match(temp9);
      if((res0 === null)) {
        code0.pos = pos0;
      } else {
        break;
      }
      break;
    }
    if((res0 === null)) {
      break;
    } else {
      results0["type"] = res0;
    }
    res0 = grammar0["BLOCKEXPR"]();
    if((res0 === null)) {
      break;
    } else {
      results0["value"] = res0;
    }
    result0 = results0;
    break;
  }
  return result0;
};
grammar0["IF"] = function() {
  while(true) {
    pos0 = code0.pos;
    while(true) {
      pos1 = code0.pos;
      while(true) {
        res1 = null;
        pos2 = code0.pos;
        res1 = grammar0["_NEWLINE"]();
        if((res1 === null)) {
          code0.pos = pos2;
        } else {
          break;
        }
        pos2 = code0.pos;
        res1 = grammar0["_INDENT"]();
        if((res1 === null)) {
          code0.pos = pos2;
        } else {
          break;
        }
        break;
      }
      if((res1 === null)) {
        res1 = undefined;
        code0.pos = pos1;
      }
      if((res1 === null)) {
        break;
      }
      res1 = grammar0["_ELSE"]();
      if((res1 === null)) {
        break;
      }
      res1 = grammar0["BLOCK"]();
      if((res1 === null)) {
        break;
      } else {
        results1["elseBlock"] = res1;
      }
      res0 = results1;
      break;
    }
    if((res0 === null)) {
      res0 = undefined;
      code0.pos = pos0;
    }
    if((res0 === null)) {
      break;
    }
    res0 = grammar0["EXPR"]();
    if((res0 === null)) {
      break;
    } else {
      results0["cond"] = res0;
    }
    res0 = grammar0["BLOCK"]();
    if((res0 === null)) {
      break;
    } else {
      results0["block"] = res0;
    }
    if((res0 === null)) {
      break;
    } else {
      _.extend(results0, res0);
    }
    result0 = results0;
    break;
  }
  return result0;
};
grammar0["UNLESS"] = function() {
  while(true) {
    pos0 = code0.pos;
    while(true) {
      pos1 = code0.pos;
      while(true) {
        res1 = null;
        pos2 = code0.pos;
        res1 = grammar0["_NEWLINE"]();
        if((res1 === null)) {
          code0.pos = pos2;
        } else {
          break;
        }
        pos2 = code0.pos;
        res1 = grammar0["_INDENT"]();
        if((res1 === null)) {
          code0.pos = pos2;
        } else {
          break;
        }
        break;
      }
      if((res1 === null)) {
        res1 = undefined;
        code0.pos = pos1;
      }
      if((res1 === null)) {
        break;
      }
      res1 = grammar0["_ELSE"]();
      if((res1 === null)) {
        break;
      }
      res1 = grammar0["BLOCK"]();
      if((res1 === null)) {
        break;
      } else {
        results1["elseBlock"] = res1;
      }
      res0 = results1;
      break;
    }
    if((res0 === null)) {
      res0 = undefined;
      code0.pos = pos0;
    }
    if((res0 === null)) {
      break;
    }
    res0 = grammar0["EXPR"]();
    if((res0 === null)) {
      break;
    } else {
      results0["cond"] = res0;
    }
    res0 = grammar0["BLOCK"]();
    if((res0 === null)) {
      break;
    } else {
      results0["block"] = res0;
    }
    if((res0 === null)) {
      break;
    } else {
      _.extend(results0, res0);
    }
    result0 = results0;
    break;
  }
  return result0;
};
grammar0["FOR"] = function() {
  while(true) {
    pos0 = code0.pos;
    while(true) {
      res0 = undefined;
      results1 = {
      };
      res1 = grammar0["_WHEN"]();
      if((res1 === null)) {
        break;
      }
      res1 = grammar0["EXPR"]();
      if((res1 === null)) {
        break;
      } else {
        results1["cond"] = res1;
      }
      res0 = results1;
      break;
    }
    if((res0 === null)) {
      res0 = undefined;
      code0.pos = pos0;
    }
    res0 = matches0;
    if((res0 === null)) {
      break;
    } else {
      results0["own"] = res0;
    }
    if((res0 === null)) {
      break;
    } else {
      results0["keys"] = res0;
    }
    while(true) {
      res0 = null;
      pos0 = code0.pos;
      res0 = grammar0["_IN"]();
      if((res0 === null)) {
        code0.pos = pos0;
      } else {
        break;
      }
      pos0 = code0.pos;
      res0 = grammar0["_OF"]();
      if((res0 === null)) {
        code0.pos = pos0;
      } else {
        break;
      }
      break;
    }
    if((res0 === null)) {
      break;
    } else {
      results0["type"] = res0;
    }
    res0 = grammar0["EXPR"]();
    if((res0 === null)) {
      break;
    } else {
      results0["obj"] = res0;
    }
    if((res0 === null)) {
      break;
    } else {
      _.extend(results0, res0);
    }
    res0 = grammar0["BLOCK"]();
    if((res0 === null)) {
      break;
    } else {
      results0["block"] = res0;
    }
    result0 = results0;
    break;
  }
  return result0;
};
grammar0["LOOP"] = function() {
  while(true) {
    result0 = undefined;
    results0 = {
    };
    res0 = grammar0["_LOOP"]();
    if((res0 === null)) {
      break;
    }
    res0 = grammar0["BLOCK"]();
    if((res0 === null)) {
      break;
    } else {
      results0["block"] = res0;
    }
    result0 = results0;
    break;
  }
  return result0;
};
grammar0["WHILE"] = function() {
  while(true) {
    result0 = undefined;
    results0 = {
    };
    res0 = grammar0["_WHILE"]();
    if((res0 === null)) {
      break;
    }
    res0 = grammar0["EXPR"]();
    if((res0 === null)) {
      break;
    } else {
      results0["cond"] = res0;
    }
    res0 = grammar0["BLOCK"]();
    if((res0 === null)) {
      break;
    } else {
      results0["block"] = res0;
    }
    result0 = results0;
    break;
  }
  return result0;
};
grammar0["SWITCH"] = function() {
  while(true) {
    pos0 = code0.pos;
    res0 = grammar0["DEFAULT"]();
    if((res0 === null)) {
      res0 = undefined;
      code0.pos = pos0;
    }
    res0 = matches0;
    res0 = grammar0["EXPR"]();
    if((res0 === null)) {
      break;
    } else {
      results0["obj"] = res0;
    }
    res0 = grammar0["_INDENT"]();
    if((res0 === null)) {
      break;
    }
    if((res0 === null)) {
      break;
    } else {
      results0["cases"] = res0;
    }
    if((res0 === null)) {
      break;
    } else {
      results0["default"] = res0;
    }
    result0 = results0;
    break;
  }
  return result0;
};
grammar0["CASE"] = function() {
  while(true) {
    matches0 = [];
    pos0 = code0.pos;
    outer:
    while(true) {
      resV0 = grammar0["EXPR"]();
      if((resV0 === null)) {
        res0 = null;
        break outer;
      }
      matches0.push(resV0);
      inner:
      while(true) {
        pos1 = code0.pos;
        resJ0 = grammar0["_COMMA"]();
        if((resJ0 === null)) {
          code0.pos = pos1;
          break inner;
        }
        resV0 = grammar0["EXPR"]();
        if((resV0 === null)) {
          code0.pos = pos1;
          break inner;
        }
        matches0.push(resV0);
      }
      if((1 > matches0.length)) {
        res0 = null;
        code0.pos = pos0;
        break outer;
      }
      break outer;
    }
    res0 = matches0;
    if((res0 === null)) {
      break;
    } else {
      results0["matches"] = res0;
    }
    res0 = grammar0["BLOCK"]();
    if((res0 === null)) {
      break;
    } else {
      results0["block"] = res0;
    }
    result0 = results0;
    break;
  }
  return result0;
};
grammar0["DEFAULT"] = function() {
  while(true) {
    result0 = undefined;
    res0 = grammar0["_NEWLINE"]();
    if((res0 === null)) {
      result0 = null;
      break;
    }
    res0 = grammar0["_ELSE"]();
    if((res0 === null)) {
      result0 = null;
      break;
    }
    res0 = grammar0["BLOCK"]();
    result0 = res0;
    if((res0 === null)) {
      result0 = null;
      break;
    }
    break;
  }
  return result0;
};
grammar0["TRY"] = function() {
  while(true) {
    pos0 = code0.pos;
    while(true) {
      pos1 = code0.pos;
      res1 = grammar0["_NEWLINE"]();
      if((res1 === null)) {
        res1 = undefined;
        code0.pos = pos1;
      }
      if((res1 === null)) {
        break;
      }
      res1 = grammar0["_FINALLY"]();
      if((res1 === null)) {
        break;
      }
      res1 = grammar0["BLOCK"]();
      if((res1 === null)) {
        break;
      } else {
        results1["finally"] = res1;
      }
      res0 = results1;
      break;
    }
    if((res0 === null)) {
      res0 = undefined;
      code0.pos = pos0;
    }
    if((res0 === null)) {
      break;
    }
    res0 = grammar0["BLOCK"]();
    if((res0 === null)) {
      break;
    } else {
      results0["block"] = res0;
    }
    if((res0 === null)) {
      break;
    } else {
      _.extend(results0, res0);
    }
    if((res0 === null)) {
      break;
    } else {
      _.extend(results0, res0);
    }
    result0 = results0;
    break;
  }
  return result0;
};
grammar0["OP50_OP"] = function() {
  while(true) {
    result0 = null;
    pos0 = code0.pos;
    temp10 = {
    };
    code0.match(temp10);
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    pos0 = code0.pos;
    temp11 = {
    };
    code0.match(temp11);
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    break;
  }
  return result0;
};
grammar0["OP50[0]"] = function() {
  while(true) {
    result0 = undefined;
    results0 = {
    };
    res0 = grammar0["OPATOM"]();
    if((res0 === null)) {
      break;
    } else {
      results0["left"] = res0;
    }
    res0 = grammar0["OP50_OP"]();
    if((res0 === null)) {
      break;
    } else {
      results0["op"] = res0;
    }
    result0 = results0;
    break;
  }
  return result0;
};
grammar0["OP50[1]"] = function() {
  while(true) {
    result0 = undefined;
    results0 = {
    };
    res0 = grammar0["_"]();
    if((res0 === null)) {
      break;
    }
    res0 = grammar0["OP50_OP"]();
    if((res0 === null)) {
      break;
    } else {
      results0["op"] = res0;
    }
    res0 = grammar0["OPATOM"]();
    if((res0 === null)) {
      break;
    } else {
      results0["right"] = res0;
    }
    result0 = results0;
    break;
  }
  return result0;
};
grammar0["OPATOM"] = function() {
  while(true) {
    result0 = null;
    pos0 = code0.pos;
    result0 = grammar0["FUNC"]();
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    pos0 = code0.pos;
    result0 = grammar0["RIGHT_RECURSIVE"]();
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    pos0 = code0.pos;
    result0 = grammar0["COMPLEX"]();
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    pos0 = code0.pos;
    result0 = grammar0["ASSIGNABLE"]();
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    break;
  }
  return result0;
};
grammar0["OP45_OP"] = function() {
  temp12 = {
  };
  code0.match(temp12);
  return result0;
};
grammar0["OP45[0]"] = function() {
  while(true) {
    pos0 = code0.pos;
    res0 = grammar0["_SOFTLINE"]();
    if((res0 === null)) {
      res0 = undefined;
      code0.pos = pos0;
    }
    if((res0 === null)) {
      break;
    } else {
      results0["left"] = res0;
    }
    res0 = grammar0["_"]();
    if((res0 === null)) {
      break;
    }
    res0 = grammar0["OP45_OP"]();
    if((res0 === null)) {
      break;
    } else {
      results0["op"] = res0;
    }
    if((res0 === null)) {
      break;
    }
    res0 = grammar0["OP50"]();
    if((res0 === null)) {
      break;
    } else {
      results0["right"] = res0;
    }
    result0 = results0;
    break;
  }
  return result0;
};
grammar0["OP50"] = function() {
  while(true) {
    result0 = null;
    pos0 = code0.pos;
    while(true) {
      result0 = undefined;
      results0 = {
      };
      res0 = grammar0["OPATOM"]();
      if((res0 === null)) {
        break;
      } else {
        results0["left"] = res0;
      }
      res0 = grammar0["OP50_OP"]();
      if((res0 === null)) {
        break;
      } else {
        results0["op"] = res0;
      }
      result0 = results0;
      break;
    }
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    pos0 = code0.pos;
    while(true) {
      result0 = undefined;
      results0 = {
      };
      res0 = grammar0["_"]();
      if((res0 === null)) {
        break;
      }
      res0 = grammar0["OP50_OP"]();
      if((res0 === null)) {
        break;
      } else {
        results0["op"] = res0;
      }
      res0 = grammar0["OPATOM"]();
      if((res0 === null)) {
        break;
      } else {
        results0["right"] = res0;
      }
      result0 = results0;
      break;
    }
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    pos0 = code0.pos;
    while(true) {
      result0 = null;
      pos1 = code0.pos;
      result0 = grammar0["FUNC"]();
      if((result0 === null)) {
        code0.pos = pos1;
      } else {
        break;
      }
      pos1 = code0.pos;
      result0 = grammar0["RIGHT_RECURSIVE"]();
      if((result0 === null)) {
        code0.pos = pos1;
      } else {
        break;
      }
      pos1 = code0.pos;
      result0 = grammar0["COMPLEX"]();
      if((result0 === null)) {
        code0.pos = pos1;
      } else {
        break;
      }
      pos1 = code0.pos;
      result0 = grammar0["ASSIGNABLE"]();
      if((result0 === null)) {
        code0.pos = pos1;
      } else {
        break;
      }
      break;
    }
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    break;
  }
  return result0;
};
grammar0["OP40_OP"] = function() {
  while(true) {
    result0 = null;
    pos0 = code0.pos;
    result0 = grammar0["_NOT"]();
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    pos0 = code0.pos;
    temp13 = {
    };
    code0.match(temp13);
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    pos0 = code0.pos;
    temp14 = {
    };
    code0.match(temp14);
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    break;
  }
  return result0;
};
grammar0["OP40[0]"] = function() {
  while(true) {
    result0 = undefined;
    results0 = {
    };
    res0 = grammar0["_"]();
    if((res0 === null)) {
      break;
    }
    res0 = grammar0["OP40_OP"]();
    if((res0 === null)) {
      break;
    } else {
      results0["op"] = res0;
    }
    res0 = grammar0["OP45"]();
    if((res0 === null)) {
      break;
    } else {
      results0["right"] = res0;
    }
    result0 = results0;
    break;
  }
  return result0;
};
grammar0["OP45"] = function() {
  while(true) {
    result0 = null;
    pos0 = code0.pos;
    while(true) {
      pos1 = code0.pos;
      res0 = grammar0["_SOFTLINE"]();
      if((res0 === null)) {
        res0 = undefined;
        code0.pos = pos1;
      }
      if((res0 === null)) {
        break;
      } else {
        results0["left"] = res0;
      }
      res0 = grammar0["_"]();
      if((res0 === null)) {
        break;
      }
      res0 = grammar0["OP45_OP"]();
      if((res0 === null)) {
        break;
      } else {
        results0["op"] = res0;
      }
      if((res0 === null)) {
        break;
      }
      res0 = grammar0["OP50"]();
      if((res0 === null)) {
        break;
      } else {
        results0["right"] = res0;
      }
      result0 = results0;
      break;
    }
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    pos0 = code0.pos;
    while(true) {
      result0 = null;
      pos1 = code0.pos;
      while(true) {
        result0 = undefined;
        results0 = {
        };
        res0 = grammar0["OPATOM"]();
        if((res0 === null)) {
          break;
        } else {
          results0["left"] = res0;
        }
        res0 = grammar0["OP50_OP"]();
        if((res0 === null)) {
          break;
        } else {
          results0["op"] = res0;
        }
        result0 = results0;
        break;
      }
      if((result0 === null)) {
        code0.pos = pos1;
      } else {
        break;
      }
      pos1 = code0.pos;
      while(true) {
        result0 = undefined;
        results0 = {
        };
        res0 = grammar0["_"]();
        if((res0 === null)) {
          break;
        }
        res0 = grammar0["OP50_OP"]();
        if((res0 === null)) {
          break;
        } else {
          results0["op"] = res0;
        }
        res0 = grammar0["OPATOM"]();
        if((res0 === null)) {
          break;
        } else {
          results0["right"] = res0;
        }
        result0 = results0;
        break;
      }
      if((result0 === null)) {
        code0.pos = pos1;
      } else {
        break;
      }
      pos1 = code0.pos;
      while(true) {
        result0 = null;
        pos2 = code0.pos;
        result0 = grammar0["FUNC"]();
        if((result0 === null)) {
          code0.pos = pos2;
        } else {
          break;
        }
        pos2 = code0.pos;
        result0 = grammar0["RIGHT_RECURSIVE"]();
        if((result0 === null)) {
          code0.pos = pos2;
        } else {
          break;
        }
        pos2 = code0.pos;
        result0 = grammar0["COMPLEX"]();
        if((result0 === null)) {
          code0.pos = pos2;
        } else {
          break;
        }
        pos2 = code0.pos;
        result0 = grammar0["ASSIGNABLE"]();
        if((result0 === null)) {
          code0.pos = pos2;
        } else {
          break;
        }
        break;
      }
      if((result0 === null)) {
        code0.pos = pos1;
      } else {
        break;
      }
      break;
    }
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    break;
  }
  return result0;
};
grammar0["OP30_OP"] = function() {
  while(true) {
    pos0 = code0.pos;
    res0 = grammar0["_NOT"]();
    if((res0 === null)) {
      res0 = undefined;
      code0.pos = pos0;
    }
    if((res0 === null)) {
      break;
    } else {
      results0["not"] = res0;
    }
    while(true) {
      res0 = null;
      pos0 = code0.pos;
      res0 = grammar0["_IN"]();
      if((res0 === null)) {
        code0.pos = pos0;
      } else {
        break;
      }
      pos0 = code0.pos;
      res0 = grammar0["_INSTANCEOF"]();
      if((res0 === null)) {
        code0.pos = pos0;
      } else {
        break;
      }
      break;
    }
    if((res0 === null)) {
      break;
    } else {
      results0["op"] = res0;
    }
    result0 = results0;
    break;
  }
  return result0;
};
grammar0["OP30[0]"] = function() {
  while(true) {
    pos0 = code0.pos;
    res0 = grammar0["_SOFTLINE"]();
    if((res0 === null)) {
      res0 = undefined;
      code0.pos = pos0;
    }
    if((res0 === null)) {
      break;
    } else {
      results0["left"] = res0;
    }
    res0 = grammar0["_"]();
    if((res0 === null)) {
      break;
    }
    res0 = grammar0["OP30_OP"]();
    if((res0 === null)) {
      break;
    } else {
      _.extend(results0, res0);
    }
    if((res0 === null)) {
      break;
    }
    res0 = grammar0["OP40"]();
    if((res0 === null)) {
      break;
    } else {
      results0["right"] = res0;
    }
    result0 = results0;
    break;
  }
  return result0;
};
grammar0["OP40"] = function() {
  while(true) {
    result0 = null;
    pos0 = code0.pos;
    while(true) {
      result0 = undefined;
      results0 = {
      };
      res0 = grammar0["_"]();
      if((res0 === null)) {
        break;
      }
      res0 = grammar0["OP40_OP"]();
      if((res0 === null)) {
        break;
      } else {
        results0["op"] = res0;
      }
      res0 = grammar0["OP45"]();
      if((res0 === null)) {
        break;
      } else {
        results0["right"] = res0;
      }
      result0 = results0;
      break;
    }
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    pos0 = code0.pos;
    while(true) {
      result0 = null;
      pos1 = code0.pos;
      while(true) {
        pos2 = code0.pos;
        res0 = grammar0["_SOFTLINE"]();
        if((res0 === null)) {
          res0 = undefined;
          code0.pos = pos2;
        }
        if((res0 === null)) {
          break;
        } else {
          results0["left"] = res0;
        }
        res0 = grammar0["_"]();
        if((res0 === null)) {
          break;
        }
        res0 = grammar0["OP45_OP"]();
        if((res0 === null)) {
          break;
        } else {
          results0["op"] = res0;
        }
        if((res0 === null)) {
          break;
        }
        res0 = grammar0["OP50"]();
        if((res0 === null)) {
          break;
        } else {
          results0["right"] = res0;
        }
        result0 = results0;
        break;
      }
      if((result0 === null)) {
        code0.pos = pos1;
      } else {
        break;
      }
      pos1 = code0.pos;
      while(true) {
        result0 = null;
        pos2 = code0.pos;
        while(true) {
          result0 = undefined;
          results0 = {
          };
          res0 = grammar0["OPATOM"]();
          if((res0 === null)) {
            break;
          } else {
            results0["left"] = res0;
          }
          res0 = grammar0["OP50_OP"]();
          if((res0 === null)) {
            break;
          } else {
            results0["op"] = res0;
          }
          result0 = results0;
          break;
        }
        if((result0 === null)) {
          code0.pos = pos2;
        } else {
          break;
        }
        pos2 = code0.pos;
        while(true) {
          result0 = undefined;
          results0 = {
          };
          res0 = grammar0["_"]();
          if((res0 === null)) {
            break;
          }
          res0 = grammar0["OP50_OP"]();
          if((res0 === null)) {
            break;
          } else {
            results0["op"] = res0;
          }
          res0 = grammar0["OPATOM"]();
          if((res0 === null)) {
            break;
          } else {
            results0["right"] = res0;
          }
          result0 = results0;
          break;
        }
        if((result0 === null)) {
          code0.pos = pos2;
        } else {
          break;
        }
        pos2 = code0.pos;
        while(true) {
          result0 = null;
          pos3 = code0.pos;
          result0 = grammar0["FUNC"]();
          if((result0 === null)) {
            code0.pos = pos3;
          } else {
            break;
          }
          pos3 = code0.pos;
          result0 = grammar0["RIGHT_RECURSIVE"]();
          if((result0 === null)) {
            code0.pos = pos3;
          } else {
            break;
          }
          pos3 = code0.pos;
          result0 = grammar0["COMPLEX"]();
          if((result0 === null)) {
            code0.pos = pos3;
          } else {
            break;
          }
          pos3 = code0.pos;
          result0 = grammar0["ASSIGNABLE"]();
          if((result0 === null)) {
            code0.pos = pos3;
          } else {
            break;
          }
          break;
        }
        if((result0 === null)) {
          code0.pos = pos2;
        } else {
          break;
        }
        break;
      }
      if((result0 === null)) {
        code0.pos = pos1;
      } else {
        break;
      }
      break;
    }
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    break;
  }
  return result0;
};
grammar0["OP20_OP"] = function() {
  while(true) {
    result0 = null;
    pos0 = code0.pos;
    temp15 = {
    };
    code0.match(temp15);
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    pos0 = code0.pos;
    temp16 = {
    };
    code0.match(temp16);
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    pos0 = code0.pos;
    temp17 = {
    };
    code0.match(temp17);
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    break;
  }
  return result0;
};
grammar0["OP20[0]"] = function() {
  while(true) {
    pos0 = code0.pos;
    res0 = grammar0["_SOFTLINE"]();
    if((res0 === null)) {
      res0 = undefined;
      code0.pos = pos0;
    }
    if((res0 === null)) {
      break;
    } else {
      results0["left"] = res0;
    }
    res0 = grammar0["_"]();
    if((res0 === null)) {
      break;
    }
    res0 = grammar0["OP20_OP"]();
    if((res0 === null)) {
      break;
    } else {
      results0["op"] = res0;
    }
    if((res0 === null)) {
      break;
    }
    res0 = grammar0["OP30"]();
    if((res0 === null)) {
      break;
    } else {
      results0["right"] = res0;
    }
    result0 = results0;
    break;
  }
  return result0;
};
grammar0["OP30"] = function() {
  while(true) {
    result0 = null;
    pos0 = code0.pos;
    while(true) {
      pos1 = code0.pos;
      res0 = grammar0["_SOFTLINE"]();
      if((res0 === null)) {
        res0 = undefined;
        code0.pos = pos1;
      }
      if((res0 === null)) {
        break;
      } else {
        results0["left"] = res0;
      }
      res0 = grammar0["_"]();
      if((res0 === null)) {
        break;
      }
      res0 = grammar0["OP30_OP"]();
      if((res0 === null)) {
        break;
      } else {
        _.extend(results0, res0);
      }
      if((res0 === null)) {
        break;
      }
      res0 = grammar0["OP40"]();
      if((res0 === null)) {
        break;
      } else {
        results0["right"] = res0;
      }
      result0 = results0;
      break;
    }
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    pos0 = code0.pos;
    while(true) {
      result0 = null;
      pos1 = code0.pos;
      while(true) {
        result0 = undefined;
        results0 = {
        };
        res0 = grammar0["_"]();
        if((res0 === null)) {
          break;
        }
        res0 = grammar0["OP40_OP"]();
        if((res0 === null)) {
          break;
        } else {
          results0["op"] = res0;
        }
        res0 = grammar0["OP45"]();
        if((res0 === null)) {
          break;
        } else {
          results0["right"] = res0;
        }
        result0 = results0;
        break;
      }
      if((result0 === null)) {
        code0.pos = pos1;
      } else {
        break;
      }
      pos1 = code0.pos;
      while(true) {
        result0 = null;
        pos2 = code0.pos;
        while(true) {
          pos3 = code0.pos;
          res0 = grammar0["_SOFTLINE"]();
          if((res0 === null)) {
            res0 = undefined;
            code0.pos = pos3;
          }
          if((res0 === null)) {
            break;
          } else {
            results0["left"] = res0;
          }
          res0 = grammar0["_"]();
          if((res0 === null)) {
            break;
          }
          res0 = grammar0["OP45_OP"]();
          if((res0 === null)) {
            break;
          } else {
            results0["op"] = res0;
          }
          if((res0 === null)) {
            break;
          }
          res0 = grammar0["OP50"]();
          if((res0 === null)) {
            break;
          } else {
            results0["right"] = res0;
          }
          result0 = results0;
          break;
        }
        if((result0 === null)) {
          code0.pos = pos2;
        } else {
          break;
        }
        pos2 = code0.pos;
        while(true) {
          result0 = null;
          pos3 = code0.pos;
          while(true) {
            result0 = undefined;
            results0 = {
            };
            res0 = grammar0["OPATOM"]();
            if((res0 === null)) {
              break;
            } else {
              results0["left"] = res0;
            }
            res0 = grammar0["OP50_OP"]();
            if((res0 === null)) {
              break;
            } else {
              results0["op"] = res0;
            }
            result0 = results0;
            break;
          }
          if((result0 === null)) {
            code0.pos = pos3;
          } else {
            break;
          }
          pos3 = code0.pos;
          while(true) {
            result0 = undefined;
            results0 = {
            };
            res0 = grammar0["_"]();
            if((res0 === null)) {
              break;
            }
            res0 = grammar0["OP50_OP"]();
            if((res0 === null)) {
              break;
            } else {
              results0["op"] = res0;
            }
            res0 = grammar0["OPATOM"]();
            if((res0 === null)) {
              break;
            } else {
              results0["right"] = res0;
            }
            result0 = results0;
            break;
          }
          if((result0 === null)) {
            code0.pos = pos3;
          } else {
            break;
          }
          pos3 = code0.pos;
          while(true) {
            result0 = null;
            pos4 = code0.pos;
            result0 = grammar0["FUNC"]();
            if((result0 === null)) {
              code0.pos = pos4;
            } else {
              break;
            }
            pos4 = code0.pos;
            result0 = grammar0["RIGHT_RECURSIVE"]();
            if((result0 === null)) {
              code0.pos = pos4;
            } else {
              break;
            }
            pos4 = code0.pos;
            result0 = grammar0["COMPLEX"]();
            if((result0 === null)) {
              code0.pos = pos4;
            } else {
              break;
            }
            pos4 = code0.pos;
            result0 = grammar0["ASSIGNABLE"]();
            if((result0 === null)) {
              code0.pos = pos4;
            } else {
              break;
            }
            break;
          }
          if((result0 === null)) {
            code0.pos = pos3;
          } else {
            break;
          }
          break;
        }
        if((result0 === null)) {
          code0.pos = pos2;
        } else {
          break;
        }
        break;
      }
      if((result0 === null)) {
        code0.pos = pos1;
      } else {
        break;
      }
      break;
    }
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    break;
  }
  return result0;
};
grammar0["OP10_OP"] = function() {
  while(true) {
    result0 = null;
    pos0 = code0.pos;
    temp18 = {
    };
    code0.match(temp18);
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    pos0 = code0.pos;
    temp19 = {
    };
    code0.match(temp19);
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    break;
  }
  return result0;
};
grammar0["OP10[0]"] = function() {
  while(true) {
    pos0 = code0.pos;
    res0 = grammar0["_SOFTLINE"]();
    if((res0 === null)) {
      res0 = undefined;
      code0.pos = pos0;
    }
    if((res0 === null)) {
      break;
    } else {
      results0["left"] = res0;
    }
    res0 = grammar0["_"]();
    if((res0 === null)) {
      break;
    }
    res0 = grammar0["OP10_OP"]();
    if((res0 === null)) {
      break;
    } else {
      results0["op"] = res0;
    }
    if((res0 === null)) {
      break;
    }
    res0 = grammar0["OP20"]();
    if((res0 === null)) {
      break;
    } else {
      results0["right"] = res0;
    }
    result0 = results0;
    break;
  }
  return result0;
};
grammar0["OP20"] = function() {
  while(true) {
    result0 = null;
    pos0 = code0.pos;
    while(true) {
      pos1 = code0.pos;
      res0 = grammar0["_SOFTLINE"]();
      if((res0 === null)) {
        res0 = undefined;
        code0.pos = pos1;
      }
      if((res0 === null)) {
        break;
      } else {
        results0["left"] = res0;
      }
      res0 = grammar0["_"]();
      if((res0 === null)) {
        break;
      }
      res0 = grammar0["OP20_OP"]();
      if((res0 === null)) {
        break;
      } else {
        results0["op"] = res0;
      }
      if((res0 === null)) {
        break;
      }
      res0 = grammar0["OP30"]();
      if((res0 === null)) {
        break;
      } else {
        results0["right"] = res0;
      }
      result0 = results0;
      break;
    }
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    pos0 = code0.pos;
    while(true) {
      result0 = null;
      pos1 = code0.pos;
      while(true) {
        pos2 = code0.pos;
        res0 = grammar0["_SOFTLINE"]();
        if((res0 === null)) {
          res0 = undefined;
          code0.pos = pos2;
        }
        if((res0 === null)) {
          break;
        } else {
          results0["left"] = res0;
        }
        res0 = grammar0["_"]();
        if((res0 === null)) {
          break;
        }
        res0 = grammar0["OP30_OP"]();
        if((res0 === null)) {
          break;
        } else {
          _.extend(results0, res0);
        }
        if((res0 === null)) {
          break;
        }
        res0 = grammar0["OP40"]();
        if((res0 === null)) {
          break;
        } else {
          results0["right"] = res0;
        }
        result0 = results0;
        break;
      }
      if((result0 === null)) {
        code0.pos = pos1;
      } else {
        break;
      }
      pos1 = code0.pos;
      while(true) {
        result0 = null;
        pos2 = code0.pos;
        while(true) {
          result0 = undefined;
          results0 = {
          };
          res0 = grammar0["_"]();
          if((res0 === null)) {
            break;
          }
          res0 = grammar0["OP40_OP"]();
          if((res0 === null)) {
            break;
          } else {
            results0["op"] = res0;
          }
          res0 = grammar0["OP45"]();
          if((res0 === null)) {
            break;
          } else {
            results0["right"] = res0;
          }
          result0 = results0;
          break;
        }
        if((result0 === null)) {
          code0.pos = pos2;
        } else {
          break;
        }
        pos2 = code0.pos;
        while(true) {
          result0 = null;
          pos3 = code0.pos;
          while(true) {
            pos4 = code0.pos;
            res0 = grammar0["_SOFTLINE"]();
            if((res0 === null)) {
              res0 = undefined;
              code0.pos = pos4;
            }
            if((res0 === null)) {
              break;
            } else {
              results0["left"] = res0;
            }
            res0 = grammar0["_"]();
            if((res0 === null)) {
              break;
            }
            res0 = grammar0["OP45_OP"]();
            if((res0 === null)) {
              break;
            } else {
              results0["op"] = res0;
            }
            if((res0 === null)) {
              break;
            }
            res0 = grammar0["OP50"]();
            if((res0 === null)) {
              break;
            } else {
              results0["right"] = res0;
            }
            result0 = results0;
            break;
          }
          if((result0 === null)) {
            code0.pos = pos3;
          } else {
            break;
          }
          pos3 = code0.pos;
          while(true) {
            result0 = null;
            pos4 = code0.pos;
            while(true) {
              result0 = undefined;
              results0 = {
              };
              res0 = grammar0["OPATOM"]();
              if((res0 === null)) {
                break;
              } else {
                results0["left"] = res0;
              }
              res0 = grammar0["OP50_OP"]();
              if((res0 === null)) {
                break;
              } else {
                results0["op"] = res0;
              }
              result0 = results0;
              break;
            }
            if((result0 === null)) {
              code0.pos = pos4;
            } else {
              break;
            }
            pos4 = code0.pos;
            while(true) {
              result0 = undefined;
              results0 = {
              };
              res0 = grammar0["_"]();
              if((res0 === null)) {
                break;
              }
              res0 = grammar0["OP50_OP"]();
              if((res0 === null)) {
                break;
              } else {
                results0["op"] = res0;
              }
              res0 = grammar0["OPATOM"]();
              if((res0 === null)) {
                break;
              } else {
                results0["right"] = res0;
              }
              result0 = results0;
              break;
            }
            if((result0 === null)) {
              code0.pos = pos4;
            } else {
              break;
            }
            pos4 = code0.pos;
            while(true) {
              result0 = null;
              pos5 = code0.pos;
              result0 = grammar0["FUNC"]();
              if((result0 === null)) {
                code0.pos = pos5;
              } else {
                break;
              }
              pos5 = code0.pos;
              result0 = grammar0["RIGHT_RECURSIVE"]();
              if((result0 === null)) {
                code0.pos = pos5;
              } else {
                break;
              }
              pos5 = code0.pos;
              result0 = grammar0["COMPLEX"]();
              if((result0 === null)) {
                code0.pos = pos5;
              } else {
                break;
              }
              pos5 = code0.pos;
              result0 = grammar0["ASSIGNABLE"]();
              if((result0 === null)) {
                code0.pos = pos5;
              } else {
                break;
              }
              break;
            }
            if((result0 === null)) {
              code0.pos = pos4;
            } else {
              break;
            }
            break;
          }
          if((result0 === null)) {
            code0.pos = pos3;
          } else {
            break;
          }
          break;
        }
        if((result0 === null)) {
          code0.pos = pos2;
        } else {
          break;
        }
        break;
      }
      if((result0 === null)) {
        code0.pos = pos1;
      } else {
        break;
      }
      break;
    }
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    break;
  }
  return result0;
};
grammar0["OP05_OP"] = function() {
  while(true) {
    result0 = null;
    pos0 = code0.pos;
    temp20 = {
    };
    code0.match(temp20);
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    pos0 = code0.pos;
    temp21 = {
    };
    code0.match(temp21);
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    pos0 = code0.pos;
    temp22 = {
    };
    code0.match(temp22);
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    pos0 = code0.pos;
    temp23 = {
    };
    code0.match(temp23);
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    pos0 = code0.pos;
    temp24 = {
    };
    code0.match(temp24);
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    pos0 = code0.pos;
    temp25 = {
    };
    code0.match(temp25);
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    pos0 = code0.pos;
    result0 = grammar0["_IS"]();
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    pos0 = code0.pos;
    result0 = grammar0["_ISNT"]();
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    break;
  }
  return result0;
};
grammar0["OP05[0]"] = function() {
  while(true) {
    pos0 = code0.pos;
    res0 = grammar0["_SOFTLINE"]();
    if((res0 === null)) {
      res0 = undefined;
      code0.pos = pos0;
    }
    if((res0 === null)) {
      break;
    } else {
      results0["left"] = res0;
    }
    res0 = grammar0["_"]();
    if((res0 === null)) {
      break;
    }
    res0 = grammar0["OP05_OP"]();
    if((res0 === null)) {
      break;
    } else {
      results0["op"] = res0;
    }
    if((res0 === null)) {
      break;
    }
    res0 = grammar0["OP10"]();
    if((res0 === null)) {
      break;
    } else {
      results0["right"] = res0;
    }
    result0 = results0;
    break;
  }
  return result0;
};
grammar0["OP10"] = function() {
  while(true) {
    result0 = null;
    pos0 = code0.pos;
    while(true) {
      pos1 = code0.pos;
      res0 = grammar0["_SOFTLINE"]();
      if((res0 === null)) {
        res0 = undefined;
        code0.pos = pos1;
      }
      if((res0 === null)) {
        break;
      } else {
        results0["left"] = res0;
      }
      res0 = grammar0["_"]();
      if((res0 === null)) {
        break;
      }
      res0 = grammar0["OP10_OP"]();
      if((res0 === null)) {
        break;
      } else {
        results0["op"] = res0;
      }
      if((res0 === null)) {
        break;
      }
      res0 = grammar0["OP20"]();
      if((res0 === null)) {
        break;
      } else {
        results0["right"] = res0;
      }
      result0 = results0;
      break;
    }
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    pos0 = code0.pos;
    while(true) {
      result0 = null;
      pos1 = code0.pos;
      while(true) {
        pos2 = code0.pos;
        res0 = grammar0["_SOFTLINE"]();
        if((res0 === null)) {
          res0 = undefined;
          code0.pos = pos2;
        }
        if((res0 === null)) {
          break;
        } else {
          results0["left"] = res0;
        }
        res0 = grammar0["_"]();
        if((res0 === null)) {
          break;
        }
        res0 = grammar0["OP20_OP"]();
        if((res0 === null)) {
          break;
        } else {
          results0["op"] = res0;
        }
        if((res0 === null)) {
          break;
        }
        res0 = grammar0["OP30"]();
        if((res0 === null)) {
          break;
        } else {
          results0["right"] = res0;
        }
        result0 = results0;
        break;
      }
      if((result0 === null)) {
        code0.pos = pos1;
      } else {
        break;
      }
      pos1 = code0.pos;
      while(true) {
        result0 = null;
        pos2 = code0.pos;
        while(true) {
          pos3 = code0.pos;
          res0 = grammar0["_SOFTLINE"]();
          if((res0 === null)) {
            res0 = undefined;
            code0.pos = pos3;
          }
          if((res0 === null)) {
            break;
          } else {
            results0["left"] = res0;
          }
          res0 = grammar0["_"]();
          if((res0 === null)) {
            break;
          }
          res0 = grammar0["OP30_OP"]();
          if((res0 === null)) {
            break;
          } else {
            _.extend(results0, res0);
          }
          if((res0 === null)) {
            break;
          }
          res0 = grammar0["OP40"]();
          if((res0 === null)) {
            break;
          } else {
            results0["right"] = res0;
          }
          result0 = results0;
          break;
        }
        if((result0 === null)) {
          code0.pos = pos2;
        } else {
          break;
        }
        pos2 = code0.pos;
        while(true) {
          result0 = null;
          pos3 = code0.pos;
          while(true) {
            result0 = undefined;
            results0 = {
            };
            res0 = grammar0["_"]();
            if((res0 === null)) {
              break;
            }
            res0 = grammar0["OP40_OP"]();
            if((res0 === null)) {
              break;
            } else {
              results0["op"] = res0;
            }
            res0 = grammar0["OP45"]();
            if((res0 === null)) {
              break;
            } else {
              results0["right"] = res0;
            }
            result0 = results0;
            break;
          }
          if((result0 === null)) {
            code0.pos = pos3;
          } else {
            break;
          }
          pos3 = code0.pos;
          while(true) {
            result0 = null;
            pos4 = code0.pos;
            while(true) {
              pos5 = code0.pos;
              res0 = grammar0["_SOFTLINE"]();
              if((res0 === null)) {
                res0 = undefined;
                code0.pos = pos5;
              }
              if((res0 === null)) {
                break;
              } else {
                results0["left"] = res0;
              }
              res0 = grammar0["_"]();
              if((res0 === null)) {
                break;
              }
              res0 = grammar0["OP45_OP"]();
              if((res0 === null)) {
                break;
              } else {
                results0["op"] = res0;
              }
              if((res0 === null)) {
                break;
              }
              res0 = grammar0["OP50"]();
              if((res0 === null)) {
                break;
              } else {
                results0["right"] = res0;
              }
              result0 = results0;
              break;
            }
            if((result0 === null)) {
              code0.pos = pos4;
            } else {
              break;
            }
            pos4 = code0.pos;
            while(true) {
              result0 = null;
              pos5 = code0.pos;
              while(true) {
                result0 = undefined;
                results0 = {
                };
                res0 = grammar0["OPATOM"]();
                if((res0 === null)) {
                  break;
                } else {
                  results0["left"] = res0;
                }
                res0 = grammar0["OP50_OP"]();
                if((res0 === null)) {
                  break;
                } else {
                  results0["op"] = res0;
                }
                result0 = results0;
                break;
              }
              if((result0 === null)) {
                code0.pos = pos5;
              } else {
                break;
              }
              pos5 = code0.pos;
              while(true) {
                result0 = undefined;
                results0 = {
                };
                res0 = grammar0["_"]();
                if((res0 === null)) {
                  break;
                }
                res0 = grammar0["OP50_OP"]();
                if((res0 === null)) {
                  break;
                } else {
                  results0["op"] = res0;
                }
                res0 = grammar0["OPATOM"]();
                if((res0 === null)) {
                  break;
                } else {
                  results0["right"] = res0;
                }
                result0 = results0;
                break;
              }
              if((result0 === null)) {
                code0.pos = pos5;
              } else {
                break;
              }
              pos5 = code0.pos;
              while(true) {
                result0 = null;
                pos6 = code0.pos;
                result0 = grammar0["FUNC"]();
                if((result0 === null)) {
                  code0.pos = pos6;
                } else {
                  break;
                }
                pos6 = code0.pos;
                result0 = grammar0["RIGHT_RECURSIVE"]();
                if((result0 === null)) {
                  code0.pos = pos6;
                } else {
                  break;
                }
                pos6 = code0.pos;
                result0 = grammar0["COMPLEX"]();
                if((result0 === null)) {
                  code0.pos = pos6;
                } else {
                  break;
                }
                pos6 = code0.pos;
                result0 = grammar0["ASSIGNABLE"]();
                if((result0 === null)) {
                  code0.pos = pos6;
                } else {
                  break;
                }
                break;
              }
              if((result0 === null)) {
                code0.pos = pos5;
              } else {
                break;
              }
              break;
            }
            if((result0 === null)) {
              code0.pos = pos4;
            } else {
              break;
            }
            break;
          }
          if((result0 === null)) {
            code0.pos = pos3;
          } else {
            break;
          }
          break;
        }
        if((result0 === null)) {
          code0.pos = pos2;
        } else {
          break;
        }
        break;
      }
      if((result0 === null)) {
        code0.pos = pos1;
      } else {
        break;
      }
      break;
    }
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    break;
  }
  return result0;
};
grammar0["OP00_OP"] = function() {
  while(true) {
    result0 = null;
    pos0 = code0.pos;
    temp26 = {
    };
    code0.match(temp26);
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    pos0 = code0.pos;
    temp27 = {
    };
    code0.match(temp27);
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    pos0 = code0.pos;
    temp28 = {
    };
    code0.match(temp28);
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    pos0 = code0.pos;
    temp29 = {
    };
    code0.match(temp29);
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    pos0 = code0.pos;
    temp30 = {
    };
    code0.match(temp30);
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    pos0 = code0.pos;
    result0 = grammar0["_AND"]();
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    pos0 = code0.pos;
    result0 = grammar0["_OR"]();
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    break;
  }
  return result0;
};
grammar0["OP00[0]"] = function() {
  while(true) {
    pos0 = code0.pos;
    res0 = grammar0["_SOFTLINE"]();
    if((res0 === null)) {
      res0 = undefined;
      code0.pos = pos0;
    }
    if((res0 === null)) {
      break;
    } else {
      results0["left"] = res0;
    }
    res0 = grammar0["_"]();
    if((res0 === null)) {
      break;
    }
    res0 = grammar0["OP00_OP"]();
    if((res0 === null)) {
      break;
    } else {
      results0["op"] = res0;
    }
    if((res0 === null)) {
      break;
    }
    res0 = grammar0["OP05"]();
    if((res0 === null)) {
      break;
    } else {
      results0["right"] = res0;
    }
    result0 = results0;
    break;
  }
  return result0;
};
grammar0["OP05"] = function() {
  while(true) {
    result0 = null;
    pos0 = code0.pos;
    while(true) {
      pos1 = code0.pos;
      res0 = grammar0["_SOFTLINE"]();
      if((res0 === null)) {
        res0 = undefined;
        code0.pos = pos1;
      }
      if((res0 === null)) {
        break;
      } else {
        results0["left"] = res0;
      }
      res0 = grammar0["_"]();
      if((res0 === null)) {
        break;
      }
      res0 = grammar0["OP05_OP"]();
      if((res0 === null)) {
        break;
      } else {
        results0["op"] = res0;
      }
      if((res0 === null)) {
        break;
      }
      res0 = grammar0["OP10"]();
      if((res0 === null)) {
        break;
      } else {
        results0["right"] = res0;
      }
      result0 = results0;
      break;
    }
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    pos0 = code0.pos;
    while(true) {
      result0 = null;
      pos1 = code0.pos;
      while(true) {
        pos2 = code0.pos;
        res0 = grammar0["_SOFTLINE"]();
        if((res0 === null)) {
          res0 = undefined;
          code0.pos = pos2;
        }
        if((res0 === null)) {
          break;
        } else {
          results0["left"] = res0;
        }
        res0 = grammar0["_"]();
        if((res0 === null)) {
          break;
        }
        res0 = grammar0["OP10_OP"]();
        if((res0 === null)) {
          break;
        } else {
          results0["op"] = res0;
        }
        if((res0 === null)) {
          break;
        }
        res0 = grammar0["OP20"]();
        if((res0 === null)) {
          break;
        } else {
          results0["right"] = res0;
        }
        result0 = results0;
        break;
      }
      if((result0 === null)) {
        code0.pos = pos1;
      } else {
        break;
      }
      pos1 = code0.pos;
      while(true) {
        result0 = null;
        pos2 = code0.pos;
        while(true) {
          pos3 = code0.pos;
          res0 = grammar0["_SOFTLINE"]();
          if((res0 === null)) {
            res0 = undefined;
            code0.pos = pos3;
          }
          if((res0 === null)) {
            break;
          } else {
            results0["left"] = res0;
          }
          res0 = grammar0["_"]();
          if((res0 === null)) {
            break;
          }
          res0 = grammar0["OP20_OP"]();
          if((res0 === null)) {
            break;
          } else {
            results0["op"] = res0;
          }
          if((res0 === null)) {
            break;
          }
          res0 = grammar0["OP30"]();
          if((res0 === null)) {
            break;
          } else {
            results0["right"] = res0;
          }
          result0 = results0;
          break;
        }
        if((result0 === null)) {
          code0.pos = pos2;
        } else {
          break;
        }
        pos2 = code0.pos;
        while(true) {
          result0 = null;
          pos3 = code0.pos;
          while(true) {
            pos4 = code0.pos;
            res0 = grammar0["_SOFTLINE"]();
            if((res0 === null)) {
              res0 = undefined;
              code0.pos = pos4;
            }
            if((res0 === null)) {
              break;
            } else {
              results0["left"] = res0;
            }
            res0 = grammar0["_"]();
            if((res0 === null)) {
              break;
            }
            res0 = grammar0["OP30_OP"]();
            if((res0 === null)) {
              break;
            } else {
              _.extend(results0, res0);
            }
            if((res0 === null)) {
              break;
            }
            res0 = grammar0["OP40"]();
            if((res0 === null)) {
              break;
            } else {
              results0["right"] = res0;
            }
            result0 = results0;
            break;
          }
          if((result0 === null)) {
            code0.pos = pos3;
          } else {
            break;
          }
          pos3 = code0.pos;
          while(true) {
            result0 = null;
            pos4 = code0.pos;
            while(true) {
              result0 = undefined;
              results0 = {
              };
              res0 = grammar0["_"]();
              if((res0 === null)) {
                break;
              }
              res0 = grammar0["OP40_OP"]();
              if((res0 === null)) {
                break;
              } else {
                results0["op"] = res0;
              }
              res0 = grammar0["OP45"]();
              if((res0 === null)) {
                break;
              } else {
                results0["right"] = res0;
              }
              result0 = results0;
              break;
            }
            if((result0 === null)) {
              code0.pos = pos4;
            } else {
              break;
            }
            pos4 = code0.pos;
            while(true) {
              result0 = null;
              pos5 = code0.pos;
              while(true) {
                pos6 = code0.pos;
                res0 = grammar0["_SOFTLINE"]();
                if((res0 === null)) {
                  res0 = undefined;
                  code0.pos = pos6;
                }
                if((res0 === null)) {
                  break;
                } else {
                  results0["left"] = res0;
                }
                res0 = grammar0["_"]();
                if((res0 === null)) {
                  break;
                }
                res0 = grammar0["OP45_OP"]();
                if((res0 === null)) {
                  break;
                } else {
                  results0["op"] = res0;
                }
                if((res0 === null)) {
                  break;
                }
                res0 = grammar0["OP50"]();
                if((res0 === null)) {
                  break;
                } else {
                  results0["right"] = res0;
                }
                result0 = results0;
                break;
              }
              if((result0 === null)) {
                code0.pos = pos5;
              } else {
                break;
              }
              pos5 = code0.pos;
              while(true) {
                result0 = null;
                pos6 = code0.pos;
                while(true) {
                  result0 = undefined;
                  results0 = {
                  };
                  res0 = grammar0["OPATOM"]();
                  if((res0 === null)) {
                    break;
                  } else {
                    results0["left"] = res0;
                  }
                  res0 = grammar0["OP50_OP"]();
                  if((res0 === null)) {
                    break;
                  } else {
                    results0["op"] = res0;
                  }
                  result0 = results0;
                  break;
                }
                if((result0 === null)) {
                  code0.pos = pos6;
                } else {
                  break;
                }
                pos6 = code0.pos;
                while(true) {
                  result0 = undefined;
                  results0 = {
                  };
                  res0 = grammar0["_"]();
                  if((res0 === null)) {
                    break;
                  }
                  res0 = grammar0["OP50_OP"]();
                  if((res0 === null)) {
                    break;
                  } else {
                    results0["op"] = res0;
                  }
                  res0 = grammar0["OPATOM"]();
                  if((res0 === null)) {
                    break;
                  } else {
                    results0["right"] = res0;
                  }
                  result0 = results0;
                  break;
                }
                if((result0 === null)) {
                  code0.pos = pos6;
                } else {
                  break;
                }
                pos6 = code0.pos;
                while(true) {
                  result0 = null;
                  pos7 = code0.pos;
                  result0 = grammar0["FUNC"]();
                  if((result0 === null)) {
                    code0.pos = pos7;
                  } else {
                    break;
                  }
                  pos7 = code0.pos;
                  result0 = grammar0["RIGHT_RECURSIVE"]();
                  if((result0 === null)) {
                    code0.pos = pos7;
                  } else {
                    break;
                  }
                  pos7 = code0.pos;
                  result0 = grammar0["COMPLEX"]();
                  if((result0 === null)) {
                    code0.pos = pos7;
                  } else {
                    break;
                  }
                  pos7 = code0.pos;
                  result0 = grammar0["ASSIGNABLE"]();
                  if((result0 === null)) {
                    code0.pos = pos7;
                  } else {
                    break;
                  }
                  break;
                }
                if((result0 === null)) {
                  code0.pos = pos6;
                } else {
                  break;
                }
                break;
              }
              if((result0 === null)) {
                code0.pos = pos5;
              } else {
                break;
              }
              break;
            }
            if((result0 === null)) {
              code0.pos = pos4;
            } else {
              break;
            }
            break;
          }
          if((result0 === null)) {
            code0.pos = pos3;
          } else {
            break;
          }
          break;
        }
        if((result0 === null)) {
          code0.pos = pos2;
        } else {
          break;
        }
        break;
      }
      if((result0 === null)) {
        code0.pos = pos1;
      } else {
        break;
      }
      break;
    }
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    break;
  }
  return result0;
};
grammar0["FUNC"] = function() {
  while(true) {
    pos0 = code0.pos;
    res0 = grammar0["BLOCK"]();
    if((res0 === null)) {
      res0 = undefined;
      code0.pos = pos0;
    }
    if((res0 === null)) {
      break;
    } else {
      results0["params"] = res0;
    }
    res0 = grammar0["_"]();
    if((res0 === null)) {
      break;
    }
    while(true) {
      res0 = null;
      pos0 = code0.pos;
      temp31 = {
      };
      code0.match(temp31);
      if((res0 === null)) {
        code0.pos = pos0;
      } else {
        break;
      }
      pos0 = code0.pos;
      temp32 = {
      };
      code0.match(temp32);
      if((res0 === null)) {
        code0.pos = pos0;
      } else {
        break;
      }
      break;
    }
    if((res0 === null)) {
      break;
    } else {
      results0["type"] = res0;
    }
    if((res0 === null)) {
      break;
    } else {
      results0["block"] = res0;
    }
    result0 = results0;
    break;
  }
  return result0;
};
grammar0["PARAMS"] = function() {
  while(true) {
    matches0 = [];
    pos0 = code0.pos;
    outer:
    while(true) {
      while(true) {
        pos1 = code0.pos;
        while(true) {
          res1 = undefined;
          res2 = grammar0["_"]();
          if((res2 === null)) {
            res1 = null;
            break;
          }
          temp33 = {
          };
          code0.match(temp33);
          if((res2 === null)) {
            res1 = null;
            break;
          }
          res2 = grammar0["LINEEXPR"]();
          res1 = res2;
          if((res2 === null)) {
            res1 = null;
            break;
          }
          break;
        }
        if((res1 === null)) {
          res1 = undefined;
          code0.pos = pos1;
        }
        if((res1 === null)) {
          break;
        } else {
          results0 = _.extend(res1, results0);
        }
        if((res1 === null)) {
          break;
        } else {
          results0["default"] = res1;
        }
        resV0 = results0;
        break;
      }
      if((resV0 === null)) {
        res0 = [];
        break outer;
      }
      matches0.push(resV0);
      inner:
      while(true) {
        pos1 = code0.pos;
        resJ0 = grammar0["_COMMA"]();
        if((resJ0 === null)) {
          code0.pos = pos1;
          break inner;
        }
        while(true) {
          pos2 = code0.pos;
          while(true) {
            res1 = undefined;
            res2 = grammar0["_"]();
            if((res2 === null)) {
              res1 = null;
              break;
            }
            temp34 = {
            };
            code0.match(temp34);
            if((res2 === null)) {
              res1 = null;
              break;
            }
            res2 = grammar0["LINEEXPR"]();
            res1 = res2;
            if((res2 === null)) {
              res1 = null;
              break;
            }
            break;
          }
          if((res1 === null)) {
            res1 = undefined;
            code0.pos = pos2;
          }
          if((res1 === null)) {
            break;
          } else {
            results0 = _.extend(res1, results0);
          }
          if((res1 === null)) {
            break;
          } else {
            results0["default"] = res1;
          }
          resV0 = results0;
          break;
        }
        if((resV0 === null)) {
          code0.pos = pos1;
          break inner;
        }
        matches0.push(resV0);
      }
      break outer;
    }
    res0 = matches0;
    if((res0 === null)) {
      result0 = null;
      break;
    }
    result0 = res0;
    if((res0 === null)) {
      result0 = null;
      break;
    }
    res0 = grammar0["_"]();
    if((res0 === null)) {
      result0 = null;
      break;
    }
    temp35 = {
    };
    code0.match(temp35);
    if((res0 === null)) {
      result0 = null;
      break;
    }
    break;
  }
  return result0;
};
grammar0["PARAM"] = function() {
  while(true) {
    result0 = null;
    pos0 = code0.pos;
    while(true) {
      pos1 = code0.pos;
      temp36 = {
      };
      code0.match(temp36);
      if((res0 === null)) {
        res0 = undefined;
        code0.pos = pos1;
      }
      if((res0 === null)) {
        break;
      } else {
        results0 = _.extend(res0, results0);
      }
      if((res0 === null)) {
        break;
      } else {
        results0["splat"] = res0;
      }
      result0 = results0;
      break;
    }
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    pos0 = code0.pos;
    while(true) {
      pos1 = code0.pos;
      temp37 = {
      };
      code0.match(temp37);
      if((res0 === null)) {
        res0 = undefined;
        code0.pos = pos1;
      }
      if((res0 === null)) {
        break;
      } else {
        results0 = _.extend(res0, results0);
      }
      if((res0 === null)) {
        break;
      } else {
        results0["splat"] = res0;
      }
      result0 = results0;
      break;
    }
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    pos0 = code0.pos;
    result0 = grammar0["OBJ_EXPL"]();
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    pos0 = code0.pos;
    result0 = grammar0["ARR_EXPL"]();
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    break;
  }
  return result0;
};
grammar0["RIGHT_RECURSIVE"] = function() {
  while(true) {
    result0 = null;
    pos0 = code0.pos;
    while(true) {
      matches0 = [];
      pos1 = code0.pos;
      outer:
      while(true) {
        while(true) {
          pos2 = code0.pos;
          temp38 = {
          };
          code0.match(temp38);
          if((res1 === null)) {
            res1 = undefined;
            code0.pos = pos2;
          }
          if((res1 === null)) {
            break;
          } else {
            results1 = _.extend(res1, results1);
          }
          if((res1 === null)) {
            break;
          } else {
            results1["splat"] = res1;
          }
          resV0 = results1;
          break;
        }
        if((resV0 === null)) {
          res0 = null;
          break outer;
        }
        matches0.push(resV0);
        inner:
        while(true) {
          pos2 = code0.pos;
          while(true) {
            resJ0 = null;
            pos3 = code0.pos;
            resJ0 = grammar0["_COMMA"]();
            if((resJ0 === null)) {
              code0.pos = pos3;
            } else {
              break;
            }
            pos3 = code0.pos;
            resJ0 = grammar0["_COMMA_NEWLINE"]();
            if((resJ0 === null)) {
              code0.pos = pos3;
            } else {
              break;
            }
            break;
          }
          if((resJ0 === null)) {
            code0.pos = pos2;
            break inner;
          }
          while(true) {
            pos3 = code0.pos;
            temp39 = {
            };
            code0.match(temp39);
            if((res1 === null)) {
              res1 = undefined;
              code0.pos = pos3;
            }
            if((res1 === null)) {
              break;
            } else {
              results1 = _.extend(res1, results1);
            }
            if((res1 === null)) {
              break;
            } else {
              results1["splat"] = res1;
            }
            resV0 = results1;
            break;
          }
          if((resV0 === null)) {
            code0.pos = pos2;
            break inner;
          }
          matches0.push(resV0);
        }
        if((1 > matches0.length)) {
          res0 = null;
          code0.pos = pos1;
          break outer;
        }
        break outer;
      }
      res0 = matches0;
      if((res0 === null)) {
        break;
      }
      if((res0 === null)) {
        break;
      } else {
        results0["params"] = res0;
      }
      result0 = results0;
      break;
    }
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    pos0 = code0.pos;
    while(true) {
      matches0 = [];
      pos1 = code0.pos;
      outer:
      while(true) {
        resV0 = grammar0["OBJ_IMPL_ITEM"]();
        if((resV0 === null)) {
          res0 = null;
          break outer;
        }
        matches0.push(resV0);
        inner:
        while(true) {
          pos2 = code0.pos;
          while(true) {
            resJ0 = null;
            pos3 = code0.pos;
            resJ0 = grammar0["_COMMA"]();
            if((resJ0 === null)) {
              code0.pos = pos3;
            } else {
              break;
            }
            pos3 = code0.pos;
            resJ0 = grammar0["_NEWLINE"]();
            if((resJ0 === null)) {
              code0.pos = pos3;
            } else {
              break;
            }
            break;
          }
          if((resJ0 === null)) {
            code0.pos = pos2;
            break inner;
          }
          resV0 = grammar0["OBJ_IMPL_ITEM"]();
          if((resV0 === null)) {
            code0.pos = pos2;
            break inner;
          }
          matches0.push(resV0);
        }
        if((1 > matches0.length)) {
          res0 = null;
          code0.pos = pos1;
          break outer;
        }
        break outer;
      }
      res0 = matches0;
      result0 = res0;
      if((res0 === null)) {
        result0 = null;
        break;
      }
      break;
    }
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    pos0 = code0.pos;
    while(true) {
      result0 = undefined;
      results0 = {
      };
      res0 = grammar0["ASSIGNABLE"]();
      if((res0 === null)) {
        break;
      } else {
        results0["target"] = res0;
      }
      res0 = grammar0["_"]();
      if((res0 === null)) {
        break;
      }
      while(true) {
        res0 = null;
        pos1 = code0.pos;
        temp40 = {
        };
        code0.match(temp40);
        if((res0 === null)) {
          code0.pos = pos1;
        } else {
          break;
        }
        pos1 = code0.pos;
        temp41 = {
        };
        code0.match(temp41);
        if((res0 === null)) {
          code0.pos = pos1;
        } else {
          break;
        }
        pos1 = code0.pos;
        temp42 = {
        };
        code0.match(temp42);
        if((res0 === null)) {
          code0.pos = pos1;
        } else {
          break;
        }
        pos1 = code0.pos;
        temp43 = {
        };
        code0.match(temp43);
        if((res0 === null)) {
          code0.pos = pos1;
        } else {
          break;
        }
        pos1 = code0.pos;
        temp44 = {
        };
        code0.match(temp44);
        if((res0 === null)) {
          code0.pos = pos1;
        } else {
          break;
        }
        pos1 = code0.pos;
        temp45 = {
        };
        code0.match(temp45);
        if((res0 === null)) {
          code0.pos = pos1;
        } else {
          break;
        }
        pos1 = code0.pos;
        temp46 = {
        };
        code0.match(temp46);
        if((res0 === null)) {
          code0.pos = pos1;
        } else {
          break;
        }
        break;
      }
      if((res0 === null)) {
        break;
      } else {
        results0["type"] = res0;
      }
      res0 = grammar0["BLOCKEXPR"]();
      if((res0 === null)) {
        break;
      } else {
        results0["value"] = res0;
      }
      result0 = results0;
      break;
    }
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    break;
  }
  return result0;
};
grammar0["COMPLEX"] = function() {
  while(true) {
    result0 = null;
    pos0 = code0.pos;
    while(true) {
      pos1 = code0.pos;
      while(true) {
        pos2 = code0.pos;
        while(true) {
          res1 = null;
          pos3 = code0.pos;
          res1 = grammar0["_NEWLINE"]();
          if((res1 === null)) {
            code0.pos = pos3;
          } else {
            break;
          }
          pos3 = code0.pos;
          res1 = grammar0["_INDENT"]();
          if((res1 === null)) {
            code0.pos = pos3;
          } else {
            break;
          }
          break;
        }
        if((res1 === null)) {
          res1 = undefined;
          code0.pos = pos2;
        }
        if((res1 === null)) {
          break;
        }
        res1 = grammar0["_ELSE"]();
        if((res1 === null)) {
          break;
        }
        res1 = grammar0["BLOCK"]();
        if((res1 === null)) {
          break;
        } else {
          results1["elseBlock"] = res1;
        }
        res0 = results1;
        break;
      }
      if((res0 === null)) {
        res0 = undefined;
        code0.pos = pos1;
      }
      if((res0 === null)) {
        break;
      }
      res0 = grammar0["EXPR"]();
      if((res0 === null)) {
        break;
      } else {
        results0["cond"] = res0;
      }
      res0 = grammar0["BLOCK"]();
      if((res0 === null)) {
        break;
      } else {
        results0["block"] = res0;
      }
      if((res0 === null)) {
        break;
      } else {
        _.extend(results0, res0);
      }
      result0 = results0;
      break;
    }
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    pos0 = code0.pos;
    while(true) {
      pos1 = code0.pos;
      while(true) {
        pos2 = code0.pos;
        while(true) {
          res1 = null;
          pos3 = code0.pos;
          res1 = grammar0["_NEWLINE"]();
          if((res1 === null)) {
            code0.pos = pos3;
          } else {
            break;
          }
          pos3 = code0.pos;
          res1 = grammar0["_INDENT"]();
          if((res1 === null)) {
            code0.pos = pos3;
          } else {
            break;
          }
          break;
        }
        if((res1 === null)) {
          res1 = undefined;
          code0.pos = pos2;
        }
        if((res1 === null)) {
          break;
        }
        res1 = grammar0["_ELSE"]();
        if((res1 === null)) {
          break;
        }
        res1 = grammar0["BLOCK"]();
        if((res1 === null)) {
          break;
        } else {
          results1["elseBlock"] = res1;
        }
        res0 = results1;
        break;
      }
      if((res0 === null)) {
        res0 = undefined;
        code0.pos = pos1;
      }
      if((res0 === null)) {
        break;
      }
      res0 = grammar0["EXPR"]();
      if((res0 === null)) {
        break;
      } else {
        results0["cond"] = res0;
      }
      res0 = grammar0["BLOCK"]();
      if((res0 === null)) {
        break;
      } else {
        results0["block"] = res0;
      }
      if((res0 === null)) {
        break;
      } else {
        _.extend(results0, res0);
      }
      result0 = results0;
      break;
    }
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    pos0 = code0.pos;
    while(true) {
      pos1 = code0.pos;
      while(true) {
        res0 = undefined;
        results1 = {
        };
        res1 = grammar0["_WHEN"]();
        if((res1 === null)) {
          break;
        }
        res1 = grammar0["EXPR"]();
        if((res1 === null)) {
          break;
        } else {
          results1["cond"] = res1;
        }
        res0 = results1;
        break;
      }
      if((res0 === null)) {
        res0 = undefined;
        code0.pos = pos1;
      }
      res0 = matches0;
      if((res0 === null)) {
        break;
      } else {
        results0["own"] = res0;
      }
      if((res0 === null)) {
        break;
      } else {
        results0["keys"] = res0;
      }
      while(true) {
        res0 = null;
        pos1 = code0.pos;
        res0 = grammar0["_IN"]();
        if((res0 === null)) {
          code0.pos = pos1;
        } else {
          break;
        }
        pos1 = code0.pos;
        res0 = grammar0["_OF"]();
        if((res0 === null)) {
          code0.pos = pos1;
        } else {
          break;
        }
        break;
      }
      if((res0 === null)) {
        break;
      } else {
        results0["type"] = res0;
      }
      res0 = grammar0["EXPR"]();
      if((res0 === null)) {
        break;
      } else {
        results0["obj"] = res0;
      }
      if((res0 === null)) {
        break;
      } else {
        _.extend(results0, res0);
      }
      res0 = grammar0["BLOCK"]();
      if((res0 === null)) {
        break;
      } else {
        results0["block"] = res0;
      }
      result0 = results0;
      break;
    }
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    pos0 = code0.pos;
    while(true) {
      result0 = undefined;
      results0 = {
      };
      res0 = grammar0["_LOOP"]();
      if((res0 === null)) {
        break;
      }
      res0 = grammar0["BLOCK"]();
      if((res0 === null)) {
        break;
      } else {
        results0["block"] = res0;
      }
      result0 = results0;
      break;
    }
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    pos0 = code0.pos;
    while(true) {
      result0 = undefined;
      results0 = {
      };
      res0 = grammar0["_WHILE"]();
      if((res0 === null)) {
        break;
      }
      res0 = grammar0["EXPR"]();
      if((res0 === null)) {
        break;
      } else {
        results0["cond"] = res0;
      }
      res0 = grammar0["BLOCK"]();
      if((res0 === null)) {
        break;
      } else {
        results0["block"] = res0;
      }
      result0 = results0;
      break;
    }
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    pos0 = code0.pos;
    while(true) {
      pos1 = code0.pos;
      res0 = grammar0["DEFAULT"]();
      if((res0 === null)) {
        res0 = undefined;
        code0.pos = pos1;
      }
      res0 = matches0;
      res0 = grammar0["EXPR"]();
      if((res0 === null)) {
        break;
      } else {
        results0["obj"] = res0;
      }
      res0 = grammar0["_INDENT"]();
      if((res0 === null)) {
        break;
      }
      if((res0 === null)) {
        break;
      } else {
        results0["cases"] = res0;
      }
      if((res0 === null)) {
        break;
      } else {
        results0["default"] = res0;
      }
      result0 = results0;
      break;
    }
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    pos0 = code0.pos;
    while(true) {
      pos1 = code0.pos;
      while(true) {
        pos2 = code0.pos;
        res1 = grammar0["_NEWLINE"]();
        if((res1 === null)) {
          res1 = undefined;
          code0.pos = pos2;
        }
        if((res1 === null)) {
          break;
        }
        res1 = grammar0["_FINALLY"]();
        if((res1 === null)) {
          break;
        }
        res1 = grammar0["BLOCK"]();
        if((res1 === null)) {
          break;
        } else {
          results1["finally"] = res1;
        }
        res0 = results1;
        break;
      }
      if((res0 === null)) {
        res0 = undefined;
        code0.pos = pos1;
      }
      if((res0 === null)) {
        break;
      }
      res0 = grammar0["BLOCK"]();
      if((res0 === null)) {
        break;
      } else {
        results0["block"] = res0;
      }
      if((res0 === null)) {
        break;
      } else {
        _.extend(results0, res0);
      }
      if((res0 === null)) {
        break;
      } else {
        _.extend(results0, res0);
      }
      result0 = results0;
      break;
    }
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    break;
  }
  return result0;
};
grammar0["OP_OPTIMIZATION"] = function() {
  while(true) {
    pos0 = code0.pos;
    while(true) {
      res1 = null;
      pos1 = code0.pos;
      res1 = grammar0["OP00_OP"]();
      if((res1 === null)) {
        code0.pos = pos1;
      } else {
        break;
      }
      pos1 = code0.pos;
      res1 = grammar0["OP05_OP"]();
      if((res1 === null)) {
        code0.pos = pos1;
      } else {
        break;
      }
      pos1 = code0.pos;
      res1 = grammar0["OP10_OP"]();
      if((res1 === null)) {
        code0.pos = pos1;
      } else {
        break;
      }
      pos1 = code0.pos;
      res1 = grammar0["OP20_OP"]();
      if((res1 === null)) {
        code0.pos = pos1;
      } else {
        break;
      }
      pos1 = code0.pos;
      res1 = grammar0["OP30_OP"]();
      if((res1 === null)) {
        code0.pos = pos1;
      } else {
        break;
      }
      break;
    }
    code0.pos = pos0;
    if((res1 !== null)) {
      res0 = null;
    } else {
      res0 = undefined;
    }
    res0 = grammar0["_"]();
    if((res0 === null)) {
      result0 = null;
      break;
    }
    if((res0 === null)) {
      result0 = null;
      break;
    }
    break;
  }
  return result0;
};
grammar0["OP00"] = function() {
  while(true) {
    result0 = null;
    pos0 = code0.pos;
    while(true) {
      pos1 = code0.pos;
      res0 = grammar0["_SOFTLINE"]();
      if((res0 === null)) {
        res0 = undefined;
        code0.pos = pos1;
      }
      if((res0 === null)) {
        break;
      } else {
        results0["left"] = res0;
      }
      res0 = grammar0["_"]();
      if((res0 === null)) {
        break;
      }
      res0 = grammar0["OP00_OP"]();
      if((res0 === null)) {
        break;
      } else {
        results0["op"] = res0;
      }
      if((res0 === null)) {
        break;
      }
      res0 = grammar0["OP05"]();
      if((res0 === null)) {
        break;
      } else {
        results0["right"] = res0;
      }
      result0 = results0;
      break;
    }
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    pos0 = code0.pos;
    while(true) {
      result0 = null;
      pos1 = code0.pos;
      while(true) {
        pos2 = code0.pos;
        res0 = grammar0["_SOFTLINE"]();
        if((res0 === null)) {
          res0 = undefined;
          code0.pos = pos2;
        }
        if((res0 === null)) {
          break;
        } else {
          results0["left"] = res0;
        }
        res0 = grammar0["_"]();
        if((res0 === null)) {
          break;
        }
        res0 = grammar0["OP05_OP"]();
        if((res0 === null)) {
          break;
        } else {
          results0["op"] = res0;
        }
        if((res0 === null)) {
          break;
        }
        res0 = grammar0["OP10"]();
        if((res0 === null)) {
          break;
        } else {
          results0["right"] = res0;
        }
        result0 = results0;
        break;
      }
      if((result0 === null)) {
        code0.pos = pos1;
      } else {
        break;
      }
      pos1 = code0.pos;
      while(true) {
        result0 = null;
        pos2 = code0.pos;
        while(true) {
          pos3 = code0.pos;
          res0 = grammar0["_SOFTLINE"]();
          if((res0 === null)) {
            res0 = undefined;
            code0.pos = pos3;
          }
          if((res0 === null)) {
            break;
          } else {
            results0["left"] = res0;
          }
          res0 = grammar0["_"]();
          if((res0 === null)) {
            break;
          }
          res0 = grammar0["OP10_OP"]();
          if((res0 === null)) {
            break;
          } else {
            results0["op"] = res0;
          }
          if((res0 === null)) {
            break;
          }
          res0 = grammar0["OP20"]();
          if((res0 === null)) {
            break;
          } else {
            results0["right"] = res0;
          }
          result0 = results0;
          break;
        }
        if((result0 === null)) {
          code0.pos = pos2;
        } else {
          break;
        }
        pos2 = code0.pos;
        while(true) {
          result0 = null;
          pos3 = code0.pos;
          while(true) {
            pos4 = code0.pos;
            res0 = grammar0["_SOFTLINE"]();
            if((res0 === null)) {
              res0 = undefined;
              code0.pos = pos4;
            }
            if((res0 === null)) {
              break;
            } else {
              results0["left"] = res0;
            }
            res0 = grammar0["_"]();
            if((res0 === null)) {
              break;
            }
            res0 = grammar0["OP20_OP"]();
            if((res0 === null)) {
              break;
            } else {
              results0["op"] = res0;
            }
            if((res0 === null)) {
              break;
            }
            res0 = grammar0["OP30"]();
            if((res0 === null)) {
              break;
            } else {
              results0["right"] = res0;
            }
            result0 = results0;
            break;
          }
          if((result0 === null)) {
            code0.pos = pos3;
          } else {
            break;
          }
          pos3 = code0.pos;
          while(true) {
            result0 = null;
            pos4 = code0.pos;
            while(true) {
              pos5 = code0.pos;
              res0 = grammar0["_SOFTLINE"]();
              if((res0 === null)) {
                res0 = undefined;
                code0.pos = pos5;
              }
              if((res0 === null)) {
                break;
              } else {
                results0["left"] = res0;
              }
              res0 = grammar0["_"]();
              if((res0 === null)) {
                break;
              }
              res0 = grammar0["OP30_OP"]();
              if((res0 === null)) {
                break;
              } else {
                _.extend(results0, res0);
              }
              if((res0 === null)) {
                break;
              }
              res0 = grammar0["OP40"]();
              if((res0 === null)) {
                break;
              } else {
                results0["right"] = res0;
              }
              result0 = results0;
              break;
            }
            if((result0 === null)) {
              code0.pos = pos4;
            } else {
              break;
            }
            pos4 = code0.pos;
            while(true) {
              result0 = null;
              pos5 = code0.pos;
              while(true) {
                result0 = undefined;
                results0 = {
                };
                res0 = grammar0["_"]();
                if((res0 === null)) {
                  break;
                }
                res0 = grammar0["OP40_OP"]();
                if((res0 === null)) {
                  break;
                } else {
                  results0["op"] = res0;
                }
                res0 = grammar0["OP45"]();
                if((res0 === null)) {
                  break;
                } else {
                  results0["right"] = res0;
                }
                result0 = results0;
                break;
              }
              if((result0 === null)) {
                code0.pos = pos5;
              } else {
                break;
              }
              pos5 = code0.pos;
              while(true) {
                result0 = null;
                pos6 = code0.pos;
                while(true) {
                  pos7 = code0.pos;
                  res0 = grammar0["_SOFTLINE"]();
                  if((res0 === null)) {
                    res0 = undefined;
                    code0.pos = pos7;
                  }
                  if((res0 === null)) {
                    break;
                  } else {
                    results0["left"] = res0;
                  }
                  res0 = grammar0["_"]();
                  if((res0 === null)) {
                    break;
                  }
                  res0 = grammar0["OP45_OP"]();
                  if((res0 === null)) {
                    break;
                  } else {
                    results0["op"] = res0;
                  }
                  if((res0 === null)) {
                    break;
                  }
                  res0 = grammar0["OP50"]();
                  if((res0 === null)) {
                    break;
                  } else {
                    results0["right"] = res0;
                  }
                  result0 = results0;
                  break;
                }
                if((result0 === null)) {
                  code0.pos = pos6;
                } else {
                  break;
                }
                pos6 = code0.pos;
                while(true) {
                  result0 = null;
                  pos7 = code0.pos;
                  while(true) {
                    result0 = undefined;
                    results0 = {
                    };
                    res0 = grammar0["OPATOM"]();
                    if((res0 === null)) {
                      break;
                    } else {
                      results0["left"] = res0;
                    }
                    res0 = grammar0["OP50_OP"]();
                    if((res0 === null)) {
                      break;
                    } else {
                      results0["op"] = res0;
                    }
                    result0 = results0;
                    break;
                  }
                  if((result0 === null)) {
                    code0.pos = pos7;
                  } else {
                    break;
                  }
                  pos7 = code0.pos;
                  while(true) {
                    result0 = undefined;
                    results0 = {
                    };
                    res0 = grammar0["_"]();
                    if((res0 === null)) {
                      break;
                    }
                    res0 = grammar0["OP50_OP"]();
                    if((res0 === null)) {
                      break;
                    } else {
                      results0["op"] = res0;
                    }
                    res0 = grammar0["OPATOM"]();
                    if((res0 === null)) {
                      break;
                    } else {
                      results0["right"] = res0;
                    }
                    result0 = results0;
                    break;
                  }
                  if((result0 === null)) {
                    code0.pos = pos7;
                  } else {
                    break;
                  }
                  pos7 = code0.pos;
                  while(true) {
                    result0 = null;
                    pos8 = code0.pos;
                    result0 = grammar0["FUNC"]();
                    if((result0 === null)) {
                      code0.pos = pos8;
                    } else {
                      break;
                    }
                    pos8 = code0.pos;
                    result0 = grammar0["RIGHT_RECURSIVE"]();
                    if((result0 === null)) {
                      code0.pos = pos8;
                    } else {
                      break;
                    }
                    pos8 = code0.pos;
                    result0 = grammar0["COMPLEX"]();
                    if((result0 === null)) {
                      code0.pos = pos8;
                    } else {
                      break;
                    }
                    pos8 = code0.pos;
                    result0 = grammar0["ASSIGNABLE"]();
                    if((result0 === null)) {
                      code0.pos = pos8;
                    } else {
                      break;
                    }
                    break;
                  }
                  if((result0 === null)) {
                    code0.pos = pos7;
                  } else {
                    break;
                  }
                  break;
                }
                if((result0 === null)) {
                  code0.pos = pos6;
                } else {
                  break;
                }
                break;
              }
              if((result0 === null)) {
                code0.pos = pos5;
              } else {
                break;
              }
              break;
            }
            if((result0 === null)) {
              code0.pos = pos4;
            } else {
              break;
            }
            break;
          }
          if((result0 === null)) {
            code0.pos = pos3;
          } else {
            break;
          }
          break;
        }
        if((result0 === null)) {
          code0.pos = pos2;
        } else {
          break;
        }
        break;
      }
      if((result0 === null)) {
        code0.pos = pos1;
      } else {
        break;
      }
      break;
    }
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    break;
  }
  return result0;
};
grammar0["POSTIF"] = function() {
  while(true) {
    result0 = undefined;
    results0 = {
    };
    res0 = grammar0["LINEEXPR"]();
    if((res0 === null)) {
      break;
    } else {
      results0["block"] = res0;
    }
    res0 = grammar0["_IF"]();
    if((res0 === null)) {
      break;
    }
    res0 = grammar0["EXPR"]();
    if((res0 === null)) {
      break;
    } else {
      results0["cond"] = res0;
    }
    result0 = results0;
    break;
  }
  return result0;
};
grammar0["POSTUNLESS"] = function() {
  while(true) {
    result0 = undefined;
    results0 = {
    };
    res0 = grammar0["LINEEXPR"]();
    if((res0 === null)) {
      break;
    } else {
      results0["block"] = res0;
    }
    res0 = grammar0["_UNLESS"]();
    if((res0 === null)) {
      break;
    }
    res0 = grammar0["EXPR"]();
    if((res0 === null)) {
      break;
    } else {
      results0["cond"] = res0;
    }
    result0 = results0;
    break;
  }
  return result0;
};
grammar0["POSTFOR"] = function() {
  while(true) {
    pos0 = code0.pos;
    while(true) {
      res0 = undefined;
      results1 = {
      };
      res1 = grammar0["_WHEN"]();
      if((res1 === null)) {
        break;
      }
      res1 = grammar0["EXPR"]();
      if((res1 === null)) {
        break;
      } else {
        results1["cond"] = res1;
      }
      res0 = results1;
      break;
    }
    if((res0 === null)) {
      res0 = undefined;
      code0.pos = pos0;
    }
    res0 = matches0;
    res0 = grammar0["_FOR"]();
    if((res0 === null)) {
      break;
    }
    if((res0 === null)) {
      break;
    } else {
      results0["own"] = res0;
    }
    if((res0 === null)) {
      break;
    } else {
      results0["keys"] = res0;
    }
    while(true) {
      res0 = null;
      pos0 = code0.pos;
      res0 = grammar0["_IN"]();
      if((res0 === null)) {
        code0.pos = pos0;
      } else {
        break;
      }
      pos0 = code0.pos;
      res0 = grammar0["_OF"]();
      if((res0 === null)) {
        code0.pos = pos0;
      } else {
        break;
      }
      break;
    }
    if((res0 === null)) {
      break;
    } else {
      results0["type"] = res0;
    }
    res0 = grammar0["EXPR"]();
    if((res0 === null)) {
      break;
    } else {
      results0["obj"] = res0;
    }
    if((res0 === null)) {
      break;
    } else {
      _.extend(results0, res0);
    }
    result0 = results0;
    break;
  }
  return result0;
};
grammar0["STMT"] = function() {
  while(true) {
    pos0 = code0.pos;
    res0 = grammar0["EXPR"]();
    if((res0 === null)) {
      res0 = undefined;
      code0.pos = pos0;
    }
    if((res0 === null)) {
      break;
    } else {
      results0["type"] = res0;
    }
    if((res0 === null)) {
      break;
    } else {
      results0["expr"] = res0;
    }
    result0 = results0;
    break;
  }
  return result0;
};
grammar0["EXPR"] = function() {
  while(true) {
    result0 = null;
    pos0 = code0.pos;
    while(true) {
      pos1 = code0.pos;
      res0 = grammar0["BLOCK"]();
      if((res0 === null)) {
        res0 = undefined;
        code0.pos = pos1;
      }
      if((res0 === null)) {
        break;
      } else {
        results0["params"] = res0;
      }
      res0 = grammar0["_"]();
      if((res0 === null)) {
        break;
      }
      while(true) {
        res0 = null;
        pos1 = code0.pos;
        temp47 = {
        };
        code0.match(temp47);
        if((res0 === null)) {
          code0.pos = pos1;
        } else {
          break;
        }
        pos1 = code0.pos;
        temp48 = {
        };
        code0.match(temp48);
        if((res0 === null)) {
          code0.pos = pos1;
        } else {
          break;
        }
        break;
      }
      if((res0 === null)) {
        break;
      } else {
        results0["type"] = res0;
      }
      if((res0 === null)) {
        break;
      } else {
        results0["block"] = res0;
      }
      result0 = results0;
      break;
    }
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    pos0 = code0.pos;
    while(true) {
      result0 = null;
      pos1 = code0.pos;
      while(true) {
        matches0 = [];
        pos2 = code0.pos;
        outer:
        while(true) {
          while(true) {
            pos3 = code0.pos;
            temp49 = {
            };
            code0.match(temp49);
            if((res1 === null)) {
              res1 = undefined;
              code0.pos = pos3;
            }
            if((res1 === null)) {
              break;
            } else {
              results1 = _.extend(res1, results1);
            }
            if((res1 === null)) {
              break;
            } else {
              results1["splat"] = res1;
            }
            resV0 = results1;
            break;
          }
          if((resV0 === null)) {
            res0 = null;
            break outer;
          }
          matches0.push(resV0);
          inner:
          while(true) {
            pos3 = code0.pos;
            while(true) {
              resJ0 = null;
              pos4 = code0.pos;
              resJ0 = grammar0["_COMMA"]();
              if((resJ0 === null)) {
                code0.pos = pos4;
              } else {
                break;
              }
              pos4 = code0.pos;
              resJ0 = grammar0["_COMMA_NEWLINE"]();
              if((resJ0 === null)) {
                code0.pos = pos4;
              } else {
                break;
              }
              break;
            }
            if((resJ0 === null)) {
              code0.pos = pos3;
              break inner;
            }
            while(true) {
              pos4 = code0.pos;
              temp50 = {
              };
              code0.match(temp50);
              if((res1 === null)) {
                res1 = undefined;
                code0.pos = pos4;
              }
              if((res1 === null)) {
                break;
              } else {
                results1 = _.extend(res1, results1);
              }
              if((res1 === null)) {
                break;
              } else {
                results1["splat"] = res1;
              }
              resV0 = results1;
              break;
            }
            if((resV0 === null)) {
              code0.pos = pos3;
              break inner;
            }
            matches0.push(resV0);
          }
          if((1 > matches0.length)) {
            res0 = null;
            code0.pos = pos2;
            break outer;
          }
          break outer;
        }
        res0 = matches0;
        if((res0 === null)) {
          break;
        }
        if((res0 === null)) {
          break;
        } else {
          results0["params"] = res0;
        }
        result0 = results0;
        break;
      }
      if((result0 === null)) {
        code0.pos = pos1;
      } else {
        break;
      }
      pos1 = code0.pos;
      while(true) {
        matches0 = [];
        pos2 = code0.pos;
        outer:
        while(true) {
          resV0 = grammar0["OBJ_IMPL_ITEM"]();
          if((resV0 === null)) {
            res0 = null;
            break outer;
          }
          matches0.push(resV0);
          inner:
          while(true) {
            pos3 = code0.pos;
            while(true) {
              resJ0 = null;
              pos4 = code0.pos;
              resJ0 = grammar0["_COMMA"]();
              if((resJ0 === null)) {
                code0.pos = pos4;
              } else {
                break;
              }
              pos4 = code0.pos;
              resJ0 = grammar0["_NEWLINE"]();
              if((resJ0 === null)) {
                code0.pos = pos4;
              } else {
                break;
              }
              break;
            }
            if((resJ0 === null)) {
              code0.pos = pos3;
              break inner;
            }
            resV0 = grammar0["OBJ_IMPL_ITEM"]();
            if((resV0 === null)) {
              code0.pos = pos3;
              break inner;
            }
            matches0.push(resV0);
          }
          if((1 > matches0.length)) {
            res0 = null;
            code0.pos = pos2;
            break outer;
          }
          break outer;
        }
        res0 = matches0;
        result0 = res0;
        if((res0 === null)) {
          result0 = null;
          break;
        }
        break;
      }
      if((result0 === null)) {
        code0.pos = pos1;
      } else {
        break;
      }
      pos1 = code0.pos;
      while(true) {
        result0 = undefined;
        results0 = {
        };
        res0 = grammar0["ASSIGNABLE"]();
        if((res0 === null)) {
          break;
        } else {
          results0["target"] = res0;
        }
        res0 = grammar0["_"]();
        if((res0 === null)) {
          break;
        }
        while(true) {
          res0 = null;
          pos2 = code0.pos;
          temp51 = {
          };
          code0.match(temp51);
          if((res0 === null)) {
            code0.pos = pos2;
          } else {
            break;
          }
          pos2 = code0.pos;
          temp52 = {
          };
          code0.match(temp52);
          if((res0 === null)) {
            code0.pos = pos2;
          } else {
            break;
          }
          pos2 = code0.pos;
          temp53 = {
          };
          code0.match(temp53);
          if((res0 === null)) {
            code0.pos = pos2;
          } else {
            break;
          }
          pos2 = code0.pos;
          temp54 = {
          };
          code0.match(temp54);
          if((res0 === null)) {
            code0.pos = pos2;
          } else {
            break;
          }
          pos2 = code0.pos;
          temp55 = {
          };
          code0.match(temp55);
          if((res0 === null)) {
            code0.pos = pos2;
          } else {
            break;
          }
          pos2 = code0.pos;
          temp56 = {
          };
          code0.match(temp56);
          if((res0 === null)) {
            code0.pos = pos2;
          } else {
            break;
          }
          pos2 = code0.pos;
          temp57 = {
          };
          code0.match(temp57);
          if((res0 === null)) {
            code0.pos = pos2;
          } else {
            break;
          }
          break;
        }
        if((res0 === null)) {
          break;
        } else {
          results0["type"] = res0;
        }
        res0 = grammar0["BLOCKEXPR"]();
        if((res0 === null)) {
          break;
        } else {
          results0["value"] = res0;
        }
        result0 = results0;
        break;
      }
      if((result0 === null)) {
        code0.pos = pos1;
      } else {
        break;
      }
      break;
    }
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    pos0 = code0.pos;
    while(true) {
      result0 = null;
      pos1 = code0.pos;
      while(true) {
        pos2 = code0.pos;
        while(true) {
          pos3 = code0.pos;
          while(true) {
            res1 = null;
            pos4 = code0.pos;
            res1 = grammar0["_NEWLINE"]();
            if((res1 === null)) {
              code0.pos = pos4;
            } else {
              break;
            }
            pos4 = code0.pos;
            res1 = grammar0["_INDENT"]();
            if((res1 === null)) {
              code0.pos = pos4;
            } else {
              break;
            }
            break;
          }
          if((res1 === null)) {
            res1 = undefined;
            code0.pos = pos3;
          }
          if((res1 === null)) {
            break;
          }
          res1 = grammar0["_ELSE"]();
          if((res1 === null)) {
            break;
          }
          res1 = grammar0["BLOCK"]();
          if((res1 === null)) {
            break;
          } else {
            results1["elseBlock"] = res1;
          }
          res0 = results1;
          break;
        }
        if((res0 === null)) {
          res0 = undefined;
          code0.pos = pos2;
        }
        if((res0 === null)) {
          break;
        }
        res0 = grammar0["EXPR"]();
        if((res0 === null)) {
          break;
        } else {
          results0["cond"] = res0;
        }
        res0 = grammar0["BLOCK"]();
        if((res0 === null)) {
          break;
        } else {
          results0["block"] = res0;
        }
        if((res0 === null)) {
          break;
        } else {
          _.extend(results0, res0);
        }
        result0 = results0;
        break;
      }
      if((result0 === null)) {
        code0.pos = pos1;
      } else {
        break;
      }
      pos1 = code0.pos;
      while(true) {
        pos2 = code0.pos;
        while(true) {
          pos3 = code0.pos;
          while(true) {
            res1 = null;
            pos4 = code0.pos;
            res1 = grammar0["_NEWLINE"]();
            if((res1 === null)) {
              code0.pos = pos4;
            } else {
              break;
            }
            pos4 = code0.pos;
            res1 = grammar0["_INDENT"]();
            if((res1 === null)) {
              code0.pos = pos4;
            } else {
              break;
            }
            break;
          }
          if((res1 === null)) {
            res1 = undefined;
            code0.pos = pos3;
          }
          if((res1 === null)) {
            break;
          }
          res1 = grammar0["_ELSE"]();
          if((res1 === null)) {
            break;
          }
          res1 = grammar0["BLOCK"]();
          if((res1 === null)) {
            break;
          } else {
            results1["elseBlock"] = res1;
          }
          res0 = results1;
          break;
        }
        if((res0 === null)) {
          res0 = undefined;
          code0.pos = pos2;
        }
        if((res0 === null)) {
          break;
        }
        res0 = grammar0["EXPR"]();
        if((res0 === null)) {
          break;
        } else {
          results0["cond"] = res0;
        }
        res0 = grammar0["BLOCK"]();
        if((res0 === null)) {
          break;
        } else {
          results0["block"] = res0;
        }
        if((res0 === null)) {
          break;
        } else {
          _.extend(results0, res0);
        }
        result0 = results0;
        break;
      }
      if((result0 === null)) {
        code0.pos = pos1;
      } else {
        break;
      }
      pos1 = code0.pos;
      while(true) {
        pos2 = code0.pos;
        while(true) {
          res0 = undefined;
          results1 = {
          };
          res1 = grammar0["_WHEN"]();
          if((res1 === null)) {
            break;
          }
          res1 = grammar0["EXPR"]();
          if((res1 === null)) {
            break;
          } else {
            results1["cond"] = res1;
          }
          res0 = results1;
          break;
        }
        if((res0 === null)) {
          res0 = undefined;
          code0.pos = pos2;
        }
        res0 = matches0;
        if((res0 === null)) {
          break;
        } else {
          results0["own"] = res0;
        }
        if((res0 === null)) {
          break;
        } else {
          results0["keys"] = res0;
        }
        while(true) {
          res0 = null;
          pos2 = code0.pos;
          res0 = grammar0["_IN"]();
          if((res0 === null)) {
            code0.pos = pos2;
          } else {
            break;
          }
          pos2 = code0.pos;
          res0 = grammar0["_OF"]();
          if((res0 === null)) {
            code0.pos = pos2;
          } else {
            break;
          }
          break;
        }
        if((res0 === null)) {
          break;
        } else {
          results0["type"] = res0;
        }
        res0 = grammar0["EXPR"]();
        if((res0 === null)) {
          break;
        } else {
          results0["obj"] = res0;
        }
        if((res0 === null)) {
          break;
        } else {
          _.extend(results0, res0);
        }
        res0 = grammar0["BLOCK"]();
        if((res0 === null)) {
          break;
        } else {
          results0["block"] = res0;
        }
        result0 = results0;
        break;
      }
      if((result0 === null)) {
        code0.pos = pos1;
      } else {
        break;
      }
      pos1 = code0.pos;
      while(true) {
        result0 = undefined;
        results0 = {
        };
        res0 = grammar0["_LOOP"]();
        if((res0 === null)) {
          break;
        }
        res0 = grammar0["BLOCK"]();
        if((res0 === null)) {
          break;
        } else {
          results0["block"] = res0;
        }
        result0 = results0;
        break;
      }
      if((result0 === null)) {
        code0.pos = pos1;
      } else {
        break;
      }
      pos1 = code0.pos;
      while(true) {
        result0 = undefined;
        results0 = {
        };
        res0 = grammar0["_WHILE"]();
        if((res0 === null)) {
          break;
        }
        res0 = grammar0["EXPR"]();
        if((res0 === null)) {
          break;
        } else {
          results0["cond"] = res0;
        }
        res0 = grammar0["BLOCK"]();
        if((res0 === null)) {
          break;
        } else {
          results0["block"] = res0;
        }
        result0 = results0;
        break;
      }
      if((result0 === null)) {
        code0.pos = pos1;
      } else {
        break;
      }
      pos1 = code0.pos;
      while(true) {
        pos2 = code0.pos;
        res0 = grammar0["DEFAULT"]();
        if((res0 === null)) {
          res0 = undefined;
          code0.pos = pos2;
        }
        res0 = matches0;
        res0 = grammar0["EXPR"]();
        if((res0 === null)) {
          break;
        } else {
          results0["obj"] = res0;
        }
        res0 = grammar0["_INDENT"]();
        if((res0 === null)) {
          break;
        }
        if((res0 === null)) {
          break;
        } else {
          results0["cases"] = res0;
        }
        if((res0 === null)) {
          break;
        } else {
          results0["default"] = res0;
        }
        result0 = results0;
        break;
      }
      if((result0 === null)) {
        code0.pos = pos1;
      } else {
        break;
      }
      pos1 = code0.pos;
      while(true) {
        pos2 = code0.pos;
        while(true) {
          pos3 = code0.pos;
          res1 = grammar0["_NEWLINE"]();
          if((res1 === null)) {
            res1 = undefined;
            code0.pos = pos3;
          }
          if((res1 === null)) {
            break;
          }
          res1 = grammar0["_FINALLY"]();
          if((res1 === null)) {
            break;
          }
          res1 = grammar0["BLOCK"]();
          if((res1 === null)) {
            break;
          } else {
            results1["finally"] = res1;
          }
          res0 = results1;
          break;
        }
        if((res0 === null)) {
          res0 = undefined;
          code0.pos = pos2;
        }
        if((res0 === null)) {
          break;
        }
        res0 = grammar0["BLOCK"]();
        if((res0 === null)) {
          break;
        } else {
          results0["block"] = res0;
        }
        if((res0 === null)) {
          break;
        } else {
          _.extend(results0, res0);
        }
        if((res0 === null)) {
          break;
        } else {
          _.extend(results0, res0);
        }
        result0 = results0;
        break;
      }
      if((result0 === null)) {
        code0.pos = pos1;
      } else {
        break;
      }
      break;
    }
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    pos0 = code0.pos;
    while(true) {
      pos1 = code0.pos;
      while(true) {
        res1 = null;
        pos2 = code0.pos;
        res1 = grammar0["OP00_OP"]();
        if((res1 === null)) {
          code0.pos = pos2;
        } else {
          break;
        }
        pos2 = code0.pos;
        res1 = grammar0["OP05_OP"]();
        if((res1 === null)) {
          code0.pos = pos2;
        } else {
          break;
        }
        pos2 = code0.pos;
        res1 = grammar0["OP10_OP"]();
        if((res1 === null)) {
          code0.pos = pos2;
        } else {
          break;
        }
        pos2 = code0.pos;
        res1 = grammar0["OP20_OP"]();
        if((res1 === null)) {
          code0.pos = pos2;
        } else {
          break;
        }
        pos2 = code0.pos;
        res1 = grammar0["OP30_OP"]();
        if((res1 === null)) {
          code0.pos = pos2;
        } else {
          break;
        }
        break;
      }
      code0.pos = pos1;
      if((res1 !== null)) {
        res0 = null;
      } else {
        res0 = undefined;
      }
      res0 = grammar0["_"]();
      if((res0 === null)) {
        result0 = null;
        break;
      }
      if((res0 === null)) {
        result0 = null;
        break;
      }
      break;
    }
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    pos0 = code0.pos;
    while(true) {
      result0 = null;
      pos1 = code0.pos;
      while(true) {
        pos2 = code0.pos;
        res0 = grammar0["_SOFTLINE"]();
        if((res0 === null)) {
          res0 = undefined;
          code0.pos = pos2;
        }
        if((res0 === null)) {
          break;
        } else {
          results0["left"] = res0;
        }
        res0 = grammar0["_"]();
        if((res0 === null)) {
          break;
        }
        res0 = grammar0["OP00_OP"]();
        if((res0 === null)) {
          break;
        } else {
          results0["op"] = res0;
        }
        if((res0 === null)) {
          break;
        }
        res0 = grammar0["OP05"]();
        if((res0 === null)) {
          break;
        } else {
          results0["right"] = res0;
        }
        result0 = results0;
        break;
      }
      if((result0 === null)) {
        code0.pos = pos1;
      } else {
        break;
      }
      pos1 = code0.pos;
      while(true) {
        result0 = null;
        pos2 = code0.pos;
        while(true) {
          pos3 = code0.pos;
          res0 = grammar0["_SOFTLINE"]();
          if((res0 === null)) {
            res0 = undefined;
            code0.pos = pos3;
          }
          if((res0 === null)) {
            break;
          } else {
            results0["left"] = res0;
          }
          res0 = grammar0["_"]();
          if((res0 === null)) {
            break;
          }
          res0 = grammar0["OP05_OP"]();
          if((res0 === null)) {
            break;
          } else {
            results0["op"] = res0;
          }
          if((res0 === null)) {
            break;
          }
          res0 = grammar0["OP10"]();
          if((res0 === null)) {
            break;
          } else {
            results0["right"] = res0;
          }
          result0 = results0;
          break;
        }
        if((result0 === null)) {
          code0.pos = pos2;
        } else {
          break;
        }
        pos2 = code0.pos;
        while(true) {
          result0 = null;
          pos3 = code0.pos;
          while(true) {
            pos4 = code0.pos;
            res0 = grammar0["_SOFTLINE"]();
            if((res0 === null)) {
              res0 = undefined;
              code0.pos = pos4;
            }
            if((res0 === null)) {
              break;
            } else {
              results0["left"] = res0;
            }
            res0 = grammar0["_"]();
            if((res0 === null)) {
              break;
            }
            res0 = grammar0["OP10_OP"]();
            if((res0 === null)) {
              break;
            } else {
              results0["op"] = res0;
            }
            if((res0 === null)) {
              break;
            }
            res0 = grammar0["OP20"]();
            if((res0 === null)) {
              break;
            } else {
              results0["right"] = res0;
            }
            result0 = results0;
            break;
          }
          if((result0 === null)) {
            code0.pos = pos3;
          } else {
            break;
          }
          pos3 = code0.pos;
          while(true) {
            result0 = null;
            pos4 = code0.pos;
            while(true) {
              pos5 = code0.pos;
              res0 = grammar0["_SOFTLINE"]();
              if((res0 === null)) {
                res0 = undefined;
                code0.pos = pos5;
              }
              if((res0 === null)) {
                break;
              } else {
                results0["left"] = res0;
              }
              res0 = grammar0["_"]();
              if((res0 === null)) {
                break;
              }
              res0 = grammar0["OP20_OP"]();
              if((res0 === null)) {
                break;
              } else {
                results0["op"] = res0;
              }
              if((res0 === null)) {
                break;
              }
              res0 = grammar0["OP30"]();
              if((res0 === null)) {
                break;
              } else {
                results0["right"] = res0;
              }
              result0 = results0;
              break;
            }
            if((result0 === null)) {
              code0.pos = pos4;
            } else {
              break;
            }
            pos4 = code0.pos;
            while(true) {
              result0 = null;
              pos5 = code0.pos;
              while(true) {
                pos6 = code0.pos;
                res0 = grammar0["_SOFTLINE"]();
                if((res0 === null)) {
                  res0 = undefined;
                  code0.pos = pos6;
                }
                if((res0 === null)) {
                  break;
                } else {
                  results0["left"] = res0;
                }
                res0 = grammar0["_"]();
                if((res0 === null)) {
                  break;
                }
                res0 = grammar0["OP30_OP"]();
                if((res0 === null)) {
                  break;
                } else {
                  _.extend(results0, res0);
                }
                if((res0 === null)) {
                  break;
                }
                res0 = grammar0["OP40"]();
                if((res0 === null)) {
                  break;
                } else {
                  results0["right"] = res0;
                }
                result0 = results0;
                break;
              }
              if((result0 === null)) {
                code0.pos = pos5;
              } else {
                break;
              }
              pos5 = code0.pos;
              while(true) {
                result0 = null;
                pos6 = code0.pos;
                while(true) {
                  result0 = undefined;
                  results0 = {
                  };
                  res0 = grammar0["_"]();
                  if((res0 === null)) {
                    break;
                  }
                  res0 = grammar0["OP40_OP"]();
                  if((res0 === null)) {
                    break;
                  } else {
                    results0["op"] = res0;
                  }
                  res0 = grammar0["OP45"]();
                  if((res0 === null)) {
                    break;
                  } else {
                    results0["right"] = res0;
                  }
                  result0 = results0;
                  break;
                }
                if((result0 === null)) {
                  code0.pos = pos6;
                } else {
                  break;
                }
                pos6 = code0.pos;
                while(true) {
                  result0 = null;
                  pos7 = code0.pos;
                  while(true) {
                    pos8 = code0.pos;
                    res0 = grammar0["_SOFTLINE"]();
                    if((res0 === null)) {
                      res0 = undefined;
                      code0.pos = pos8;
                    }
                    if((res0 === null)) {
                      break;
                    } else {
                      results0["left"] = res0;
                    }
                    res0 = grammar0["_"]();
                    if((res0 === null)) {
                      break;
                    }
                    res0 = grammar0["OP45_OP"]();
                    if((res0 === null)) {
                      break;
                    } else {
                      results0["op"] = res0;
                    }
                    if((res0 === null)) {
                      break;
                    }
                    res0 = grammar0["OP50"]();
                    if((res0 === null)) {
                      break;
                    } else {
                      results0["right"] = res0;
                    }
                    result0 = results0;
                    break;
                  }
                  if((result0 === null)) {
                    code0.pos = pos7;
                  } else {
                    break;
                  }
                  pos7 = code0.pos;
                  while(true) {
                    result0 = null;
                    pos8 = code0.pos;
                    while(true) {
                      result0 = undefined;
                      results0 = {
                      };
                      res0 = grammar0["OPATOM"]();
                      if((res0 === null)) {
                        break;
                      } else {
                        results0["left"] = res0;
                      }
                      res0 = grammar0["OP50_OP"]();
                      if((res0 === null)) {
                        break;
                      } else {
                        results0["op"] = res0;
                      }
                      result0 = results0;
                      break;
                    }
                    if((result0 === null)) {
                      code0.pos = pos8;
                    } else {
                      break;
                    }
                    pos8 = code0.pos;
                    while(true) {
                      result0 = undefined;
                      results0 = {
                      };
                      res0 = grammar0["_"]();
                      if((res0 === null)) {
                        break;
                      }
                      res0 = grammar0["OP50_OP"]();
                      if((res0 === null)) {
                        break;
                      } else {
                        results0["op"] = res0;
                      }
                      res0 = grammar0["OPATOM"]();
                      if((res0 === null)) {
                        break;
                      } else {
                        results0["right"] = res0;
                      }
                      result0 = results0;
                      break;
                    }
                    if((result0 === null)) {
                      code0.pos = pos8;
                    } else {
                      break;
                    }
                    pos8 = code0.pos;
                    while(true) {
                      result0 = null;
                      pos9 = code0.pos;
                      result0 = grammar0["FUNC"]();
                      if((result0 === null)) {
                        code0.pos = pos9;
                      } else {
                        break;
                      }
                      pos9 = code0.pos;
                      result0 = grammar0["RIGHT_RECURSIVE"]();
                      if((result0 === null)) {
                        code0.pos = pos9;
                      } else {
                        break;
                      }
                      pos9 = code0.pos;
                      result0 = grammar0["COMPLEX"]();
                      if((result0 === null)) {
                        code0.pos = pos9;
                      } else {
                        break;
                      }
                      pos9 = code0.pos;
                      result0 = grammar0["ASSIGNABLE"]();
                      if((result0 === null)) {
                        code0.pos = pos9;
                      } else {
                        break;
                      }
                      break;
                    }
                    if((result0 === null)) {
                      code0.pos = pos8;
                    } else {
                      break;
                    }
                    break;
                  }
                  if((result0 === null)) {
                    code0.pos = pos7;
                  } else {
                    break;
                  }
                  break;
                }
                if((result0 === null)) {
                  code0.pos = pos6;
                } else {
                  break;
                }
                break;
              }
              if((result0 === null)) {
                code0.pos = pos5;
              } else {
                break;
              }
              break;
            }
            if((result0 === null)) {
              code0.pos = pos4;
            } else {
              break;
            }
            break;
          }
          if((result0 === null)) {
            code0.pos = pos3;
          } else {
            break;
          }
          break;
        }
        if((result0 === null)) {
          code0.pos = pos2;
        } else {
          break;
        }
        break;
      }
      if((result0 === null)) {
        code0.pos = pos1;
      } else {
        break;
      }
      break;
    }
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    break;
  }
  return result0;
};
grammar0["HEREDOC"] = function() {
  while(true) {
    matches0 = [];
    pos0 = code0.pos;
    outer:
    while(true) {
      while(true) {
        pos1 = code0.pos;
        temp58 = {
        };
        code0.match(temp58);
        code0.pos = pos1;
        if((res2 !== null)) {
          res1 = null;
        } else {
          res1 = undefined;
        }
        if((res1 === null)) {
          resV0 = null;
          break;
        }
        res1 = grammar0["."]();
        resV0 = res1;
        if((res1 === null)) {
          resV0 = null;
          break;
        }
        break;
      }
      if((resV0 === null)) {
        res0 = [];
        break outer;
      }
      matches0.push(resV0);
      inner:
      while(true) {
        pos1 = code0.pos;
        while(true) {
          pos2 = code0.pos;
          temp59 = {
          };
          code0.match(temp59);
          code0.pos = pos2;
          if((res2 !== null)) {
            res1 = null;
          } else {
            res1 = undefined;
          }
          if((res1 === null)) {
            resV0 = null;
            break;
          }
          res1 = grammar0["."]();
          resV0 = res1;
          if((res1 === null)) {
            resV0 = null;
            break;
          }
          break;
        }
        if((resV0 === null)) {
          code0.pos = pos1;
          break inner;
        }
        matches0.push(resV0);
      }
      break outer;
    }
    res0 = matches0;
    if((res0 === null)) {
      result0 = null;
      break;
    }
    if((res0 === null)) {
      result0 = null;
      break;
    }
    result0 = res0;
    if((res0 === null)) {
      result0 = null;
      break;
    }
    temp60 = {
    };
    code0.match(temp60);
    if((res0 === null)) {
      result0 = null;
      break;
    }
    break;
  }
  return result0;
};
grammar0["LINEEXPR"] = function() {
  while(true) {
    result0 = null;
    pos0 = code0.pos;
    while(true) {
      result0 = undefined;
      results0 = {
      };
      res0 = grammar0["LINEEXPR"]();
      if((res0 === null)) {
        break;
      } else {
        results0["block"] = res0;
      }
      res0 = grammar0["_IF"]();
      if((res0 === null)) {
        break;
      }
      res0 = grammar0["EXPR"]();
      if((res0 === null)) {
        break;
      } else {
        results0["cond"] = res0;
      }
      result0 = results0;
      break;
    }
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    pos0 = code0.pos;
    while(true) {
      result0 = undefined;
      results0 = {
      };
      res0 = grammar0["LINEEXPR"]();
      if((res0 === null)) {
        break;
      } else {
        results0["block"] = res0;
      }
      res0 = grammar0["_UNLESS"]();
      if((res0 === null)) {
        break;
      }
      res0 = grammar0["EXPR"]();
      if((res0 === null)) {
        break;
      } else {
        results0["cond"] = res0;
      }
      result0 = results0;
      break;
    }
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    pos0 = code0.pos;
    while(true) {
      pos1 = code0.pos;
      while(true) {
        res0 = undefined;
        results1 = {
        };
        res1 = grammar0["_WHEN"]();
        if((res1 === null)) {
          break;
        }
        res1 = grammar0["EXPR"]();
        if((res1 === null)) {
          break;
        } else {
          results1["cond"] = res1;
        }
        res0 = results1;
        break;
      }
      if((res0 === null)) {
        res0 = undefined;
        code0.pos = pos1;
      }
      res0 = matches0;
      res0 = grammar0["_FOR"]();
      if((res0 === null)) {
        break;
      }
      if((res0 === null)) {
        break;
      } else {
        results0["own"] = res0;
      }
      if((res0 === null)) {
        break;
      } else {
        results0["keys"] = res0;
      }
      while(true) {
        res0 = null;
        pos1 = code0.pos;
        res0 = grammar0["_IN"]();
        if((res0 === null)) {
          code0.pos = pos1;
        } else {
          break;
        }
        pos1 = code0.pos;
        res0 = grammar0["_OF"]();
        if((res0 === null)) {
          code0.pos = pos1;
        } else {
          break;
        }
        break;
      }
      if((res0 === null)) {
        break;
      } else {
        results0["type"] = res0;
      }
      res0 = grammar0["EXPR"]();
      if((res0 === null)) {
        break;
      } else {
        results0["obj"] = res0;
      }
      if((res0 === null)) {
        break;
      } else {
        _.extend(results0, res0);
      }
      result0 = results0;
      break;
    }
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    pos0 = code0.pos;
    while(true) {
      pos1 = code0.pos;
      res0 = grammar0["EXPR"]();
      if((res0 === null)) {
        res0 = undefined;
        code0.pos = pos1;
      }
      if((res0 === null)) {
        break;
      } else {
        results0["type"] = res0;
      }
      if((res0 === null)) {
        break;
      } else {
        results0["expr"] = res0;
      }
      result0 = results0;
      break;
    }
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    pos0 = code0.pos;
    while(true) {
      result0 = null;
      pos1 = code0.pos;
      while(true) {
        pos2 = code0.pos;
        res0 = grammar0["BLOCK"]();
        if((res0 === null)) {
          res0 = undefined;
          code0.pos = pos2;
        }
        if((res0 === null)) {
          break;
        } else {
          results0["params"] = res0;
        }
        res0 = grammar0["_"]();
        if((res0 === null)) {
          break;
        }
        while(true) {
          res0 = null;
          pos2 = code0.pos;
          temp61 = {
          };
          code0.match(temp61);
          if((res0 === null)) {
            code0.pos = pos2;
          } else {
            break;
          }
          pos2 = code0.pos;
          temp62 = {
          };
          code0.match(temp62);
          if((res0 === null)) {
            code0.pos = pos2;
          } else {
            break;
          }
          break;
        }
        if((res0 === null)) {
          break;
        } else {
          results0["type"] = res0;
        }
        if((res0 === null)) {
          break;
        } else {
          results0["block"] = res0;
        }
        result0 = results0;
        break;
      }
      if((result0 === null)) {
        code0.pos = pos1;
      } else {
        break;
      }
      pos1 = code0.pos;
      while(true) {
        result0 = null;
        pos2 = code0.pos;
        while(true) {
          matches0 = [];
          pos3 = code0.pos;
          outer:
          while(true) {
            while(true) {
              pos4 = code0.pos;
              temp63 = {
              };
              code0.match(temp63);
              if((res1 === null)) {
                res1 = undefined;
                code0.pos = pos4;
              }
              if((res1 === null)) {
                break;
              } else {
                results1 = _.extend(res1, results1);
              }
              if((res1 === null)) {
                break;
              } else {
                results1["splat"] = res1;
              }
              resV0 = results1;
              break;
            }
            if((resV0 === null)) {
              res0 = null;
              break outer;
            }
            matches0.push(resV0);
            inner:
            while(true) {
              pos4 = code0.pos;
              while(true) {
                resJ0 = null;
                pos5 = code0.pos;
                resJ0 = grammar0["_COMMA"]();
                if((resJ0 === null)) {
                  code0.pos = pos5;
                } else {
                  break;
                }
                pos5 = code0.pos;
                resJ0 = grammar0["_COMMA_NEWLINE"]();
                if((resJ0 === null)) {
                  code0.pos = pos5;
                } else {
                  break;
                }
                break;
              }
              if((resJ0 === null)) {
                code0.pos = pos4;
                break inner;
              }
              while(true) {
                pos5 = code0.pos;
                temp64 = {
                };
                code0.match(temp64);
                if((res1 === null)) {
                  res1 = undefined;
                  code0.pos = pos5;
                }
                if((res1 === null)) {
                  break;
                } else {
                  results1 = _.extend(res1, results1);
                }
                if((res1 === null)) {
                  break;
                } else {
                  results1["splat"] = res1;
                }
                resV0 = results1;
                break;
              }
              if((resV0 === null)) {
                code0.pos = pos4;
                break inner;
              }
              matches0.push(resV0);
            }
            if((1 > matches0.length)) {
              res0 = null;
              code0.pos = pos3;
              break outer;
            }
            break outer;
          }
          res0 = matches0;
          if((res0 === null)) {
            break;
          }
          if((res0 === null)) {
            break;
          } else {
            results0["params"] = res0;
          }
          result0 = results0;
          break;
        }
        if((result0 === null)) {
          code0.pos = pos2;
        } else {
          break;
        }
        pos2 = code0.pos;
        while(true) {
          matches0 = [];
          pos3 = code0.pos;
          outer:
          while(true) {
            resV0 = grammar0["OBJ_IMPL_ITEM"]();
            if((resV0 === null)) {
              res0 = null;
              break outer;
            }
            matches0.push(resV0);
            inner:
            while(true) {
              pos4 = code0.pos;
              while(true) {
                resJ0 = null;
                pos5 = code0.pos;
                resJ0 = grammar0["_COMMA"]();
                if((resJ0 === null)) {
                  code0.pos = pos5;
                } else {
                  break;
                }
                pos5 = code0.pos;
                resJ0 = grammar0["_NEWLINE"]();
                if((resJ0 === null)) {
                  code0.pos = pos5;
                } else {
                  break;
                }
                break;
              }
              if((resJ0 === null)) {
                code0.pos = pos4;
                break inner;
              }
              resV0 = grammar0["OBJ_IMPL_ITEM"]();
              if((resV0 === null)) {
                code0.pos = pos4;
                break inner;
              }
              matches0.push(resV0);
            }
            if((1 > matches0.length)) {
              res0 = null;
              code0.pos = pos3;
              break outer;
            }
            break outer;
          }
          res0 = matches0;
          result0 = res0;
          if((res0 === null)) {
            result0 = null;
            break;
          }
          break;
        }
        if((result0 === null)) {
          code0.pos = pos2;
        } else {
          break;
        }
        pos2 = code0.pos;
        while(true) {
          result0 = undefined;
          results0 = {
          };
          res0 = grammar0["ASSIGNABLE"]();
          if((res0 === null)) {
            break;
          } else {
            results0["target"] = res0;
          }
          res0 = grammar0["_"]();
          if((res0 === null)) {
            break;
          }
          while(true) {
            res0 = null;
            pos3 = code0.pos;
            temp65 = {
            };
            code0.match(temp65);
            if((res0 === null)) {
              code0.pos = pos3;
            } else {
              break;
            }
            pos3 = code0.pos;
            temp66 = {
            };
            code0.match(temp66);
            if((res0 === null)) {
              code0.pos = pos3;
            } else {
              break;
            }
            pos3 = code0.pos;
            temp67 = {
            };
            code0.match(temp67);
            if((res0 === null)) {
              code0.pos = pos3;
            } else {
              break;
            }
            pos3 = code0.pos;
            temp68 = {
            };
            code0.match(temp68);
            if((res0 === null)) {
              code0.pos = pos3;
            } else {
              break;
            }
            pos3 = code0.pos;
            temp69 = {
            };
            code0.match(temp69);
            if((res0 === null)) {
              code0.pos = pos3;
            } else {
              break;
            }
            pos3 = code0.pos;
            temp70 = {
            };
            code0.match(temp70);
            if((res0 === null)) {
              code0.pos = pos3;
            } else {
              break;
            }
            pos3 = code0.pos;
            temp71 = {
            };
            code0.match(temp71);
            if((res0 === null)) {
              code0.pos = pos3;
            } else {
              break;
            }
            break;
          }
          if((res0 === null)) {
            break;
          } else {
            results0["type"] = res0;
          }
          res0 = grammar0["BLOCKEXPR"]();
          if((res0 === null)) {
            break;
          } else {
            results0["value"] = res0;
          }
          result0 = results0;
          break;
        }
        if((result0 === null)) {
          code0.pos = pos2;
        } else {
          break;
        }
        break;
      }
      if((result0 === null)) {
        code0.pos = pos1;
      } else {
        break;
      }
      pos1 = code0.pos;
      while(true) {
        result0 = null;
        pos2 = code0.pos;
        while(true) {
          pos3 = code0.pos;
          while(true) {
            pos4 = code0.pos;
            while(true) {
              res1 = null;
              pos5 = code0.pos;
              res1 = grammar0["_NEWLINE"]();
              if((res1 === null)) {
                code0.pos = pos5;
              } else {
                break;
              }
              pos5 = code0.pos;
              res1 = grammar0["_INDENT"]();
              if((res1 === null)) {
                code0.pos = pos5;
              } else {
                break;
              }
              break;
            }
            if((res1 === null)) {
              res1 = undefined;
              code0.pos = pos4;
            }
            if((res1 === null)) {
              break;
            }
            res1 = grammar0["_ELSE"]();
            if((res1 === null)) {
              break;
            }
            res1 = grammar0["BLOCK"]();
            if((res1 === null)) {
              break;
            } else {
              results1["elseBlock"] = res1;
            }
            res0 = results1;
            break;
          }
          if((res0 === null)) {
            res0 = undefined;
            code0.pos = pos3;
          }
          if((res0 === null)) {
            break;
          }
          res0 = grammar0["EXPR"]();
          if((res0 === null)) {
            break;
          } else {
            results0["cond"] = res0;
          }
          res0 = grammar0["BLOCK"]();
          if((res0 === null)) {
            break;
          } else {
            results0["block"] = res0;
          }
          if((res0 === null)) {
            break;
          } else {
            _.extend(results0, res0);
          }
          result0 = results0;
          break;
        }
        if((result0 === null)) {
          code0.pos = pos2;
        } else {
          break;
        }
        pos2 = code0.pos;
        while(true) {
          pos3 = code0.pos;
          while(true) {
            pos4 = code0.pos;
            while(true) {
              res1 = null;
              pos5 = code0.pos;
              res1 = grammar0["_NEWLINE"]();
              if((res1 === null)) {
                code0.pos = pos5;
              } else {
                break;
              }
              pos5 = code0.pos;
              res1 = grammar0["_INDENT"]();
              if((res1 === null)) {
                code0.pos = pos5;
              } else {
                break;
              }
              break;
            }
            if((res1 === null)) {
              res1 = undefined;
              code0.pos = pos4;
            }
            if((res1 === null)) {
              break;
            }
            res1 = grammar0["_ELSE"]();
            if((res1 === null)) {
              break;
            }
            res1 = grammar0["BLOCK"]();
            if((res1 === null)) {
              break;
            } else {
              results1["elseBlock"] = res1;
            }
            res0 = results1;
            break;
          }
          if((res0 === null)) {
            res0 = undefined;
            code0.pos = pos3;
          }
          if((res0 === null)) {
            break;
          }
          res0 = grammar0["EXPR"]();
          if((res0 === null)) {
            break;
          } else {
            results0["cond"] = res0;
          }
          res0 = grammar0["BLOCK"]();
          if((res0 === null)) {
            break;
          } else {
            results0["block"] = res0;
          }
          if((res0 === null)) {
            break;
          } else {
            _.extend(results0, res0);
          }
          result0 = results0;
          break;
        }
        if((result0 === null)) {
          code0.pos = pos2;
        } else {
          break;
        }
        pos2 = code0.pos;
        while(true) {
          pos3 = code0.pos;
          while(true) {
            res0 = undefined;
            results1 = {
            };
            res1 = grammar0["_WHEN"]();
            if((res1 === null)) {
              break;
            }
            res1 = grammar0["EXPR"]();
            if((res1 === null)) {
              break;
            } else {
              results1["cond"] = res1;
            }
            res0 = results1;
            break;
          }
          if((res0 === null)) {
            res0 = undefined;
            code0.pos = pos3;
          }
          res0 = matches0;
          if((res0 === null)) {
            break;
          } else {
            results0["own"] = res0;
          }
          if((res0 === null)) {
            break;
          } else {
            results0["keys"] = res0;
          }
          while(true) {
            res0 = null;
            pos3 = code0.pos;
            res0 = grammar0["_IN"]();
            if((res0 === null)) {
              code0.pos = pos3;
            } else {
              break;
            }
            pos3 = code0.pos;
            res0 = grammar0["_OF"]();
            if((res0 === null)) {
              code0.pos = pos3;
            } else {
              break;
            }
            break;
          }
          if((res0 === null)) {
            break;
          } else {
            results0["type"] = res0;
          }
          res0 = grammar0["EXPR"]();
          if((res0 === null)) {
            break;
          } else {
            results0["obj"] = res0;
          }
          if((res0 === null)) {
            break;
          } else {
            _.extend(results0, res0);
          }
          res0 = grammar0["BLOCK"]();
          if((res0 === null)) {
            break;
          } else {
            results0["block"] = res0;
          }
          result0 = results0;
          break;
        }
        if((result0 === null)) {
          code0.pos = pos2;
        } else {
          break;
        }
        pos2 = code0.pos;
        while(true) {
          result0 = undefined;
          results0 = {
          };
          res0 = grammar0["_LOOP"]();
          if((res0 === null)) {
            break;
          }
          res0 = grammar0["BLOCK"]();
          if((res0 === null)) {
            break;
          } else {
            results0["block"] = res0;
          }
          result0 = results0;
          break;
        }
        if((result0 === null)) {
          code0.pos = pos2;
        } else {
          break;
        }
        pos2 = code0.pos;
        while(true) {
          result0 = undefined;
          results0 = {
          };
          res0 = grammar0["_WHILE"]();
          if((res0 === null)) {
            break;
          }
          res0 = grammar0["EXPR"]();
          if((res0 === null)) {
            break;
          } else {
            results0["cond"] = res0;
          }
          res0 = grammar0["BLOCK"]();
          if((res0 === null)) {
            break;
          } else {
            results0["block"] = res0;
          }
          result0 = results0;
          break;
        }
        if((result0 === null)) {
          code0.pos = pos2;
        } else {
          break;
        }
        pos2 = code0.pos;
        while(true) {
          pos3 = code0.pos;
          res0 = grammar0["DEFAULT"]();
          if((res0 === null)) {
            res0 = undefined;
            code0.pos = pos3;
          }
          res0 = matches0;
          res0 = grammar0["EXPR"]();
          if((res0 === null)) {
            break;
          } else {
            results0["obj"] = res0;
          }
          res0 = grammar0["_INDENT"]();
          if((res0 === null)) {
            break;
          }
          if((res0 === null)) {
            break;
          } else {
            results0["cases"] = res0;
          }
          if((res0 === null)) {
            break;
          } else {
            results0["default"] = res0;
          }
          result0 = results0;
          break;
        }
        if((result0 === null)) {
          code0.pos = pos2;
        } else {
          break;
        }
        pos2 = code0.pos;
        while(true) {
          pos3 = code0.pos;
          while(true) {
            pos4 = code0.pos;
            res1 = grammar0["_NEWLINE"]();
            if((res1 === null)) {
              res1 = undefined;
              code0.pos = pos4;
            }
            if((res1 === null)) {
              break;
            }
            res1 = grammar0["_FINALLY"]();
            if((res1 === null)) {
              break;
            }
            res1 = grammar0["BLOCK"]();
            if((res1 === null)) {
              break;
            } else {
              results1["finally"] = res1;
            }
            res0 = results1;
            break;
          }
          if((res0 === null)) {
            res0 = undefined;
            code0.pos = pos3;
          }
          if((res0 === null)) {
            break;
          }
          res0 = grammar0["BLOCK"]();
          if((res0 === null)) {
            break;
          } else {
            results0["block"] = res0;
          }
          if((res0 === null)) {
            break;
          } else {
            _.extend(results0, res0);
          }
          if((res0 === null)) {
            break;
          } else {
            _.extend(results0, res0);
          }
          result0 = results0;
          break;
        }
        if((result0 === null)) {
          code0.pos = pos2;
        } else {
          break;
        }
        break;
      }
      if((result0 === null)) {
        code0.pos = pos1;
      } else {
        break;
      }
      pos1 = code0.pos;
      while(true) {
        pos2 = code0.pos;
        while(true) {
          res1 = null;
          pos3 = code0.pos;
          res1 = grammar0["OP00_OP"]();
          if((res1 === null)) {
            code0.pos = pos3;
          } else {
            break;
          }
          pos3 = code0.pos;
          res1 = grammar0["OP05_OP"]();
          if((res1 === null)) {
            code0.pos = pos3;
          } else {
            break;
          }
          pos3 = code0.pos;
          res1 = grammar0["OP10_OP"]();
          if((res1 === null)) {
            code0.pos = pos3;
          } else {
            break;
          }
          pos3 = code0.pos;
          res1 = grammar0["OP20_OP"]();
          if((res1 === null)) {
            code0.pos = pos3;
          } else {
            break;
          }
          pos3 = code0.pos;
          res1 = grammar0["OP30_OP"]();
          if((res1 === null)) {
            code0.pos = pos3;
          } else {
            break;
          }
          break;
        }
        code0.pos = pos2;
        if((res1 !== null)) {
          res0 = null;
        } else {
          res0 = undefined;
        }
        res0 = grammar0["_"]();
        if((res0 === null)) {
          result0 = null;
          break;
        }
        if((res0 === null)) {
          result0 = null;
          break;
        }
        break;
      }
      if((result0 === null)) {
        code0.pos = pos1;
      } else {
        break;
      }
      pos1 = code0.pos;
      while(true) {
        result0 = null;
        pos2 = code0.pos;
        while(true) {
          pos3 = code0.pos;
          res0 = grammar0["_SOFTLINE"]();
          if((res0 === null)) {
            res0 = undefined;
            code0.pos = pos3;
          }
          if((res0 === null)) {
            break;
          } else {
            results0["left"] = res0;
          }
          res0 = grammar0["_"]();
          if((res0 === null)) {
            break;
          }
          res0 = grammar0["OP00_OP"]();
          if((res0 === null)) {
            break;
          } else {
            results0["op"] = res0;
          }
          if((res0 === null)) {
            break;
          }
          res0 = grammar0["OP05"]();
          if((res0 === null)) {
            break;
          } else {
            results0["right"] = res0;
          }
          result0 = results0;
          break;
        }
        if((result0 === null)) {
          code0.pos = pos2;
        } else {
          break;
        }
        pos2 = code0.pos;
        while(true) {
          result0 = null;
          pos3 = code0.pos;
          while(true) {
            pos4 = code0.pos;
            res0 = grammar0["_SOFTLINE"]();
            if((res0 === null)) {
              res0 = undefined;
              code0.pos = pos4;
            }
            if((res0 === null)) {
              break;
            } else {
              results0["left"] = res0;
            }
            res0 = grammar0["_"]();
            if((res0 === null)) {
              break;
            }
            res0 = grammar0["OP05_OP"]();
            if((res0 === null)) {
              break;
            } else {
              results0["op"] = res0;
            }
            if((res0 === null)) {
              break;
            }
            res0 = grammar0["OP10"]();
            if((res0 === null)) {
              break;
            } else {
              results0["right"] = res0;
            }
            result0 = results0;
            break;
          }
          if((result0 === null)) {
            code0.pos = pos3;
          } else {
            break;
          }
          pos3 = code0.pos;
          while(true) {
            result0 = null;
            pos4 = code0.pos;
            while(true) {
              pos5 = code0.pos;
              res0 = grammar0["_SOFTLINE"]();
              if((res0 === null)) {
                res0 = undefined;
                code0.pos = pos5;
              }
              if((res0 === null)) {
                break;
              } else {
                results0["left"] = res0;
              }
              res0 = grammar0["_"]();
              if((res0 === null)) {
                break;
              }
              res0 = grammar0["OP10_OP"]();
              if((res0 === null)) {
                break;
              } else {
                results0["op"] = res0;
              }
              if((res0 === null)) {
                break;
              }
              res0 = grammar0["OP20"]();
              if((res0 === null)) {
                break;
              } else {
                results0["right"] = res0;
              }
              result0 = results0;
              break;
            }
            if((result0 === null)) {
              code0.pos = pos4;
            } else {
              break;
            }
            pos4 = code0.pos;
            while(true) {
              result0 = null;
              pos5 = code0.pos;
              while(true) {
                pos6 = code0.pos;
                res0 = grammar0["_SOFTLINE"]();
                if((res0 === null)) {
                  res0 = undefined;
                  code0.pos = pos6;
                }
                if((res0 === null)) {
                  break;
                } else {
                  results0["left"] = res0;
                }
                res0 = grammar0["_"]();
                if((res0 === null)) {
                  break;
                }
                res0 = grammar0["OP20_OP"]();
                if((res0 === null)) {
                  break;
                } else {
                  results0["op"] = res0;
                }
                if((res0 === null)) {
                  break;
                }
                res0 = grammar0["OP30"]();
                if((res0 === null)) {
                  break;
                } else {
                  results0["right"] = res0;
                }
                result0 = results0;
                break;
              }
              if((result0 === null)) {
                code0.pos = pos5;
              } else {
                break;
              }
              pos5 = code0.pos;
              while(true) {
                result0 = null;
                pos6 = code0.pos;
                while(true) {
                  pos7 = code0.pos;
                  res0 = grammar0["_SOFTLINE"]();
                  if((res0 === null)) {
                    res0 = undefined;
                    code0.pos = pos7;
                  }
                  if((res0 === null)) {
                    break;
                  } else {
                    results0["left"] = res0;
                  }
                  res0 = grammar0["_"]();
                  if((res0 === null)) {
                    break;
                  }
                  res0 = grammar0["OP30_OP"]();
                  if((res0 === null)) {
                    break;
                  } else {
                    _.extend(results0, res0);
                  }
                  if((res0 === null)) {
                    break;
                  }
                  res0 = grammar0["OP40"]();
                  if((res0 === null)) {
                    break;
                  } else {
                    results0["right"] = res0;
                  }
                  result0 = results0;
                  break;
                }
                if((result0 === null)) {
                  code0.pos = pos6;
                } else {
                  break;
                }
                pos6 = code0.pos;
                while(true) {
                  result0 = null;
                  pos7 = code0.pos;
                  while(true) {
                    result0 = undefined;
                    results0 = {
                    };
                    res0 = grammar0["_"]();
                    if((res0 === null)) {
                      break;
                    }
                    res0 = grammar0["OP40_OP"]();
                    if((res0 === null)) {
                      break;
                    } else {
                      results0["op"] = res0;
                    }
                    res0 = grammar0["OP45"]();
                    if((res0 === null)) {
                      break;
                    } else {
                      results0["right"] = res0;
                    }
                    result0 = results0;
                    break;
                  }
                  if((result0 === null)) {
                    code0.pos = pos7;
                  } else {
                    break;
                  }
                  pos7 = code0.pos;
                  while(true) {
                    result0 = null;
                    pos8 = code0.pos;
                    while(true) {
                      pos9 = code0.pos;
                      res0 = grammar0["_SOFTLINE"]();
                      if((res0 === null)) {
                        res0 = undefined;
                        code0.pos = pos9;
                      }
                      if((res0 === null)) {
                        break;
                      } else {
                        results0["left"] = res0;
                      }
                      res0 = grammar0["_"]();
                      if((res0 === null)) {
                        break;
                      }
                      res0 = grammar0["OP45_OP"]();
                      if((res0 === null)) {
                        break;
                      } else {
                        results0["op"] = res0;
                      }
                      if((res0 === null)) {
                        break;
                      }
                      res0 = grammar0["OP50"]();
                      if((res0 === null)) {
                        break;
                      } else {
                        results0["right"] = res0;
                      }
                      result0 = results0;
                      break;
                    }
                    if((result0 === null)) {
                      code0.pos = pos8;
                    } else {
                      break;
                    }
                    pos8 = code0.pos;
                    while(true) {
                      result0 = null;
                      pos9 = code0.pos;
                      while(true) {
                        result0 = undefined;
                        results0 = {
                        };
                        res0 = grammar0["OPATOM"]();
                        if((res0 === null)) {
                          break;
                        } else {
                          results0["left"] = res0;
                        }
                        res0 = grammar0["OP50_OP"]();
                        if((res0 === null)) {
                          break;
                        } else {
                          results0["op"] = res0;
                        }
                        result0 = results0;
                        break;
                      }
                      if((result0 === null)) {
                        code0.pos = pos9;
                      } else {
                        break;
                      }
                      pos9 = code0.pos;
                      while(true) {
                        result0 = undefined;
                        results0 = {
                        };
                        res0 = grammar0["_"]();
                        if((res0 === null)) {
                          break;
                        }
                        res0 = grammar0["OP50_OP"]();
                        if((res0 === null)) {
                          break;
                        } else {
                          results0["op"] = res0;
                        }
                        res0 = grammar0["OPATOM"]();
                        if((res0 === null)) {
                          break;
                        } else {
                          results0["right"] = res0;
                        }
                        result0 = results0;
                        break;
                      }
                      if((result0 === null)) {
                        code0.pos = pos9;
                      } else {
                        break;
                      }
                      pos9 = code0.pos;
                      while(true) {
                        result0 = null;
                        pos10 = code0.pos;
                        result0 = grammar0["FUNC"]();
                        if((result0 === null)) {
                          code0.pos = pos10;
                        } else {
                          break;
                        }
                        pos10 = code0.pos;
                        result0 = grammar0["RIGHT_RECURSIVE"]();
                        if((result0 === null)) {
                          code0.pos = pos10;
                        } else {
                          break;
                        }
                        pos10 = code0.pos;
                        result0 = grammar0["COMPLEX"]();
                        if((result0 === null)) {
                          code0.pos = pos10;
                        } else {
                          break;
                        }
                        pos10 = code0.pos;
                        result0 = grammar0["ASSIGNABLE"]();
                        if((result0 === null)) {
                          code0.pos = pos10;
                        } else {
                          break;
                        }
                        break;
                      }
                      if((result0 === null)) {
                        code0.pos = pos9;
                      } else {
                        break;
                      }
                      break;
                    }
                    if((result0 === null)) {
                      code0.pos = pos8;
                    } else {
                      break;
                    }
                    break;
                  }
                  if((result0 === null)) {
                    code0.pos = pos7;
                  } else {
                    break;
                  }
                  break;
                }
                if((result0 === null)) {
                  code0.pos = pos6;
                } else {
                  break;
                }
                break;
              }
              if((result0 === null)) {
                code0.pos = pos5;
              } else {
                break;
              }
              break;
            }
            if((result0 === null)) {
              code0.pos = pos4;
            } else {
              break;
            }
            break;
          }
          if((result0 === null)) {
            code0.pos = pos3;
          } else {
            break;
          }
          break;
        }
        if((result0 === null)) {
          code0.pos = pos2;
        } else {
          break;
        }
        break;
      }
      if((result0 === null)) {
        code0.pos = pos1;
      } else {
        break;
      }
      break;
    }
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    break;
  }
  return result0;
};
grammar0["TYPEOF[0]"] = function() {
  while(true) {
    matches0 = [];
    pos0 = code0.pos;
    outer:
    while(true) {
      resV0 = grammar0["LINEEXPR"]();
      if((resV0 === null)) {
        res0 = null;
        break outer;
      }
      matches0.push(resV0);
      inner:
      while(true) {
        pos1 = code0.pos;
        resV0 = grammar0["LINEEXPR"]();
        if((resV0 === null)) {
          code0.pos = pos1;
          break inner;
        }
        matches0.push(resV0);
        if((matches0.length >= 1)) {
          break inner;
        }
      }
      if((1 > matches0.length)) {
        res0 = null;
        code0.pos = pos0;
        break outer;
      }
      break outer;
    }
    res0 = matches0;
    temp72 = {
    };
    code0.match(temp72);
    if((res0 === null)) {
      break;
    }
    res0 = grammar0["___"]();
    if((res0 === null)) {
      break;
    }
    if((res0 === null)) {
      break;
    } else {
      results0["params"] = res0;
    }
    res0 = grammar0["___"]();
    if((res0 === null)) {
      break;
    }
    temp73 = {
    };
    code0.match(temp73);
    if((res0 === null)) {
      break;
    }
    result0 = results0;
    break;
  }
  return result0;
};
grammar0["TYPEOF[1]"] = function() {
  while(true) {
    matches0 = [];
    pos0 = code0.pos;
    outer:
    while(true) {
      resV0 = grammar0["LINEEXPR"]();
      if((resV0 === null)) {
        res0 = null;
        break outer;
      }
      matches0.push(resV0);
      inner:
      while(true) {
        pos1 = code0.pos;
        resV0 = grammar0["LINEEXPR"]();
        if((resV0 === null)) {
          code0.pos = pos1;
          break inner;
        }
        matches0.push(resV0);
        if((matches0.length >= 1)) {
          break inner;
        }
      }
      if((1 > matches0.length)) {
        res0 = null;
        code0.pos = pos0;
        break outer;
      }
      break outer;
    }
    res0 = matches0;
    res0 = grammar0["__"]();
    if((res0 === null)) {
      break;
    }
    if((res0 === null)) {
      break;
    } else {
      results0["params"] = res0;
    }
    result0 = results0;
    break;
  }
  return result0;
};
grammar0["STRING[0]"] = function() {
  while(true) {
    matches0 = [];
    pos0 = code0.pos;
    outer:
    while(true) {
      while(true) {
        pos1 = code0.pos;
        res2 = grammar0["_QUOTE"]();
        code0.pos = pos1;
        if((res2 !== null)) {
          res1 = null;
        } else {
          res1 = undefined;
        }
        if((res1 === null)) {
          resV0 = null;
          break;
        }
        while(true) {
          res1 = null;
          pos1 = code0.pos;
          res1 = grammar0["ESCSTR"]();
          if((res1 === null)) {
            code0.pos = pos1;
          } else {
            break;
          }
          pos1 = code0.pos;
          res1 = grammar0["."]();
          if((res1 === null)) {
            code0.pos = pos1;
          } else {
            break;
          }
          break;
        }
        resV0 = res1;
        if((res1 === null)) {
          resV0 = null;
          break;
        }
        break;
      }
      if((resV0 === null)) {
        res0 = [];
        break outer;
      }
      matches0.push(resV0);
      inner:
      while(true) {
        pos1 = code0.pos;
        while(true) {
          pos2 = code0.pos;
          res2 = grammar0["_QUOTE"]();
          code0.pos = pos2;
          if((res2 !== null)) {
            res1 = null;
          } else {
            res1 = undefined;
          }
          if((res1 === null)) {
            resV0 = null;
            break;
          }
          while(true) {
            res1 = null;
            pos2 = code0.pos;
            res1 = grammar0["ESCSTR"]();
            if((res1 === null)) {
              code0.pos = pos2;
            } else {
              break;
            }
            pos2 = code0.pos;
            res1 = grammar0["."]();
            if((res1 === null)) {
              code0.pos = pos2;
            } else {
              break;
            }
            break;
          }
          resV0 = res1;
          if((res1 === null)) {
            resV0 = null;
            break;
          }
          break;
        }
        if((resV0 === null)) {
          code0.pos = pos1;
          break inner;
        }
        matches0.push(resV0);
      }
      break outer;
    }
    res0 = matches0;
    if((res0 === null)) {
      result0 = null;
      break;
    }
    result0 = res0;
    if((res0 === null)) {
      result0 = null;
      break;
    }
    res0 = grammar0["_QUOTE"]();
    if((res0 === null)) {
      result0 = null;
      break;
    }
    break;
  }
  return result0;
};
grammar0["STRING[1]"] = function() {
  while(true) {
    matches0 = [];
    pos0 = code0.pos;
    outer:
    while(true) {
      while(true) {
        pos1 = code0.pos;
        res2 = grammar0["_TQUOTE"]();
        code0.pos = pos1;
        if((res2 !== null)) {
          res1 = null;
        } else {
          res1 = undefined;
        }
        if((res1 === null)) {
          resV0 = null;
          break;
        }
        while(true) {
          res1 = null;
          pos1 = code0.pos;
          res1 = grammar0["ESCSTR"]();
          if((res1 === null)) {
            code0.pos = pos1;
          } else {
            break;
          }
          pos1 = code0.pos;
          res1 = grammar0["INTERP"]();
          if((res1 === null)) {
            code0.pos = pos1;
          } else {
            break;
          }
          pos1 = code0.pos;
          res1 = grammar0["."]();
          if((res1 === null)) {
            code0.pos = pos1;
          } else {
            break;
          }
          break;
        }
        resV0 = res1;
        if((res1 === null)) {
          resV0 = null;
          break;
        }
        break;
      }
      if((resV0 === null)) {
        res0 = [];
        break outer;
      }
      matches0.push(resV0);
      inner:
      while(true) {
        pos1 = code0.pos;
        while(true) {
          pos2 = code0.pos;
          res2 = grammar0["_TQUOTE"]();
          code0.pos = pos2;
          if((res2 !== null)) {
            res1 = null;
          } else {
            res1 = undefined;
          }
          if((res1 === null)) {
            resV0 = null;
            break;
          }
          while(true) {
            res1 = null;
            pos2 = code0.pos;
            res1 = grammar0["ESCSTR"]();
            if((res1 === null)) {
              code0.pos = pos2;
            } else {
              break;
            }
            pos2 = code0.pos;
            res1 = grammar0["INTERP"]();
            if((res1 === null)) {
              code0.pos = pos2;
            } else {
              break;
            }
            pos2 = code0.pos;
            res1 = grammar0["."]();
            if((res1 === null)) {
              code0.pos = pos2;
            } else {
              break;
            }
            break;
          }
          resV0 = res1;
          if((res1 === null)) {
            resV0 = null;
            break;
          }
          break;
        }
        if((resV0 === null)) {
          code0.pos = pos1;
          break inner;
        }
        matches0.push(resV0);
      }
      break outer;
    }
    res0 = matches0;
    if((res0 === null)) {
      result0 = null;
      break;
    }
    result0 = res0;
    if((res0 === null)) {
      result0 = null;
      break;
    }
    res0 = grammar0["_TQUOTE"]();
    if((res0 === null)) {
      result0 = null;
      break;
    }
    break;
  }
  return result0;
};
grammar0["STRING[2]"] = function() {
  while(true) {
    matches0 = [];
    pos0 = code0.pos;
    outer:
    while(true) {
      while(true) {
        pos1 = code0.pos;
        res2 = grammar0["_DQUOTE"]();
        code0.pos = pos1;
        if((res2 !== null)) {
          res1 = null;
        } else {
          res1 = undefined;
        }
        if((res1 === null)) {
          resV0 = null;
          break;
        }
        while(true) {
          res1 = null;
          pos1 = code0.pos;
          res1 = grammar0["ESCSTR"]();
          if((res1 === null)) {
            code0.pos = pos1;
          } else {
            break;
          }
          pos1 = code0.pos;
          res1 = grammar0["INTERP"]();
          if((res1 === null)) {
            code0.pos = pos1;
          } else {
            break;
          }
          pos1 = code0.pos;
          res1 = grammar0["."]();
          if((res1 === null)) {
            code0.pos = pos1;
          } else {
            break;
          }
          break;
        }
        resV0 = res1;
        if((res1 === null)) {
          resV0 = null;
          break;
        }
        break;
      }
      if((resV0 === null)) {
        res0 = [];
        break outer;
      }
      matches0.push(resV0);
      inner:
      while(true) {
        pos1 = code0.pos;
        while(true) {
          pos2 = code0.pos;
          res2 = grammar0["_DQUOTE"]();
          code0.pos = pos2;
          if((res2 !== null)) {
            res1 = null;
          } else {
            res1 = undefined;
          }
          if((res1 === null)) {
            resV0 = null;
            break;
          }
          while(true) {
            res1 = null;
            pos2 = code0.pos;
            res1 = grammar0["ESCSTR"]();
            if((res1 === null)) {
              code0.pos = pos2;
            } else {
              break;
            }
            pos2 = code0.pos;
            res1 = grammar0["INTERP"]();
            if((res1 === null)) {
              code0.pos = pos2;
            } else {
              break;
            }
            pos2 = code0.pos;
            res1 = grammar0["."]();
            if((res1 === null)) {
              code0.pos = pos2;
            } else {
              break;
            }
            break;
          }
          resV0 = res1;
          if((res1 === null)) {
            resV0 = null;
            break;
          }
          break;
        }
        if((resV0 === null)) {
          code0.pos = pos1;
          break inner;
        }
        matches0.push(resV0);
      }
      break outer;
    }
    res0 = matches0;
    if((res0 === null)) {
      result0 = null;
      break;
    }
    result0 = res0;
    if((res0 === null)) {
      result0 = null;
      break;
    }
    res0 = grammar0["_DQUOTE"]();
    if((res0 === null)) {
      result0 = null;
      break;
    }
    break;
  }
  return result0;
};
grammar0["ESCSTR"] = function() {
  while(true) {
    result0 = undefined;
    res0 = grammar0["_SLASH"]();
    if((res0 === null)) {
      result0 = null;
      break;
    }
    res0 = grammar0["."]();
    result0 = res0;
    if((res0 === null)) {
      result0 = null;
      break;
    }
    break;
  }
  return result0;
};
grammar0["INTERP"] = function() {
  while(true) {
    matches0 = [];
    pos0 = code0.pos;
    outer:
    while(true) {
      resV0 = grammar0["_BLANKLINE"]();
      if((resV0 === null)) {
        res0 = [];
        break outer;
      }
      matches0.push(resV0);
      inner:
      while(true) {
        pos1 = code0.pos;
        resV0 = grammar0["_BLANKLINE"]();
        if((resV0 === null)) {
          code0.pos = pos1;
          break inner;
        }
        matches0.push(resV0);
      }
      break outer;
    }
    res0 = matches0;
    if((res0 === null)) {
      result0 = null;
      break;
    }
    res0 = grammar0["_RESETINDENT"]();
    if((res0 === null)) {
      result0 = null;
      break;
    }
    res0 = grammar0["LINEEXPR"]();
    result0 = res0;
    if((res0 === null)) {
      result0 = null;
      break;
    }
    res0 = grammar0["___"]();
    if((res0 === null)) {
      result0 = null;
      break;
    }
    temp74 = {
    };
    code0.match(temp74);
    if((res0 === null)) {
      result0 = null;
      break;
    }
    break;
  }
  return result0;
};
grammar0["SLICE"] = function() {
  while(true) {
    pos0 = code0.pos;
    res1 = grammar0["__"]();
    code0.pos = pos0;
    if((res1 !== null)) {
      res0 = null;
    } else {
      res0 = undefined;
    }
    if((res0 === null)) {
      break;
    }
    res0 = grammar0["RANGE"]();
    if((res0 === null)) {
      break;
    } else {
      results0["range"] = res0;
    }
    result0 = results0;
    break;
  }
  return result0;
};
grammar0["INDEX0"] = function() {
  while(true) {
    result0 = undefined;
    results0 = {
    };
    res0 = grammar0["ASSIGNABLE"]();
    if((res0 === null)) {
      break;
    } else {
      results0["obj"] = res0;
    }
    temp75 = {
    };
    code0.match(temp75);
    if((res0 === null)) {
      break;
    } else {
      results0["type"] = res0;
    }
    res0 = grammar0["LINEEXPR"]();
    if((res0 === null)) {
      break;
    } else {
      results0["attr"] = res0;
    }
    res0 = grammar0["_"]();
    if((res0 === null)) {
      break;
    }
    temp76 = {
    };
    code0.match(temp76);
    if((res0 === null)) {
      break;
    }
    result0 = results0;
    break;
  }
  return result0;
};
grammar0["INDEX1"] = function() {
  while(true) {
    result0 = undefined;
    results0 = {
    };
    res0 = grammar0["ASSIGNABLE"]();
    if((res0 === null)) {
      break;
    } else {
      results0["obj"] = res0;
    }
    temp77 = {
    };
    code0.match(temp77);
    if((res0 === null)) {
      break;
    } else {
      results0["type"] = res0;
    }
    res0 = grammar0["WORD"]();
    if((res0 === null)) {
      break;
    } else {
      results0["attr"] = res0;
    }
    result0 = results0;
    break;
  }
  return result0;
};
grammar0["PROTO"] = function() {
  while(true) {
    pos0 = code0.pos;
    res0 = grammar0["WORD"]();
    if((res0 === null)) {
      res0 = undefined;
      code0.pos = pos0;
    }
    if((res0 === null)) {
      break;
    } else {
      results0["obj"] = res0;
    }
    temp78 = {
    };
    code0.match(temp78);
    if((res0 === null)) {
      break;
    } else {
      results0["type"] = res0;
    }
    if((res0 === null)) {
      break;
    } else {
      results0["attr"] = res0;
    }
    result0 = results0;
    break;
  }
  return result0;
};
grammar0["INVOC_EXPL"] = function() {
  while(true) {
    matches0 = [];
    pos0 = code0.pos;
    outer:
    while(true) {
      while(true) {
        pos1 = code0.pos;
        temp79 = {
        };
        code0.match(temp79);
        if((res1 === null)) {
          res1 = undefined;
          code0.pos = pos1;
        }
        if((res1 === null)) {
          break;
        } else {
          results1 = _.extend(res1, results1);
        }
        if((res1 === null)) {
          break;
        } else {
          results1["splat"] = res1;
        }
        resV0 = results1;
        break;
      }
      if((resV0 === null)) {
        res0 = [];
        break outer;
      }
      matches0.push(resV0);
      inner:
      while(true) {
        pos1 = code0.pos;
        while(true) {
          resJ0 = null;
          pos2 = code0.pos;
          resJ0 = grammar0["_COMMA"]();
          if((resJ0 === null)) {
            code0.pos = pos2;
          } else {
            break;
          }
          pos2 = code0.pos;
          resJ0 = grammar0["_SOFTLINE"]();
          if((resJ0 === null)) {
            code0.pos = pos2;
          } else {
            break;
          }
          break;
        }
        if((resJ0 === null)) {
          code0.pos = pos1;
          break inner;
        }
        while(true) {
          pos2 = code0.pos;
          temp80 = {
          };
          code0.match(temp80);
          if((res1 === null)) {
            res1 = undefined;
            code0.pos = pos2;
          }
          if((res1 === null)) {
            break;
          } else {
            results1 = _.extend(res1, results1);
          }
          if((res1 === null)) {
            break;
          } else {
            results1["splat"] = res1;
          }
          resV0 = results1;
          break;
        }
        if((resV0 === null)) {
          code0.pos = pos1;
          break inner;
        }
        matches0.push(resV0);
      }
      break outer;
    }
    res0 = matches0;
    temp81 = {
    };
    code0.match(temp81);
    if((res0 === null)) {
      break;
    }
    res0 = grammar0["___"]();
    if((res0 === null)) {
      break;
    }
    if((res0 === null)) {
      break;
    } else {
      results0["params"] = res0;
    }
    res0 = grammar0["___"]();
    if((res0 === null)) {
      break;
    }
    temp82 = {
    };
    code0.match(temp82);
    if((res0 === null)) {
      break;
    }
    result0 = results0;
    break;
  }
  return result0;
};
grammar0["SOAK"] = function() {
  while(true) {
    result0 = undefined;
    res0 = grammar0["ASSIGNABLE"]();
    result0 = res0;
    if((res0 === null)) {
      result0 = null;
      break;
    }
    temp83 = {
    };
    code0.match(temp83);
    if((res0 === null)) {
      result0 = null;
      break;
    }
    break;
  }
  return result0;
};
grammar0["TYPEOF"] = function() {
  while(true) {
    result0 = null;
    pos0 = code0.pos;
    while(true) {
      matches0 = [];
      pos1 = code0.pos;
      outer:
      while(true) {
        resV0 = grammar0["LINEEXPR"]();
        if((resV0 === null)) {
          res0 = null;
          break outer;
        }
        matches0.push(resV0);
        inner:
        while(true) {
          pos2 = code0.pos;
          resV0 = grammar0["LINEEXPR"]();
          if((resV0 === null)) {
            code0.pos = pos2;
            break inner;
          }
          matches0.push(resV0);
          if((matches0.length >= 1)) {
            break inner;
          }
        }
        if((1 > matches0.length)) {
          res0 = null;
          code0.pos = pos1;
          break outer;
        }
        break outer;
      }
      res0 = matches0;
      temp84 = {
      };
      code0.match(temp84);
      if((res0 === null)) {
        break;
      }
      res0 = grammar0["___"]();
      if((res0 === null)) {
        break;
      }
      if((res0 === null)) {
        break;
      } else {
        results0["params"] = res0;
      }
      res0 = grammar0["___"]();
      if((res0 === null)) {
        break;
      }
      temp85 = {
      };
      code0.match(temp85);
      if((res0 === null)) {
        break;
      }
      result0 = results0;
      break;
    }
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    pos0 = code0.pos;
    while(true) {
      matches0 = [];
      pos1 = code0.pos;
      outer:
      while(true) {
        resV0 = grammar0["LINEEXPR"]();
        if((resV0 === null)) {
          res0 = null;
          break outer;
        }
        matches0.push(resV0);
        inner:
        while(true) {
          pos2 = code0.pos;
          resV0 = grammar0["LINEEXPR"]();
          if((resV0 === null)) {
            code0.pos = pos2;
            break inner;
          }
          matches0.push(resV0);
          if((matches0.length >= 1)) {
            break inner;
          }
        }
        if((1 > matches0.length)) {
          res0 = null;
          code0.pos = pos1;
          break outer;
        }
        break outer;
      }
      res0 = matches0;
      res0 = grammar0["__"]();
      if((res0 === null)) {
        break;
      }
      if((res0 === null)) {
        break;
      } else {
        results0["params"] = res0;
      }
      result0 = results0;
      break;
    }
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    break;
  }
  return result0;
};
grammar0["RANGE"] = function() {
  while(true) {
    pos0 = code0.pos;
    while(true) {
      res0 = undefined;
      res1 = grammar0["_BY"]();
      if((res1 === null)) {
        res0 = null;
        break;
      }
      res1 = grammar0["EXPR"]();
      res0 = res1;
      if((res1 === null)) {
        res0 = null;
        break;
      }
      break;
    }
    if((res0 === null)) {
      res0 = undefined;
      code0.pos = pos0;
    }
    if((res0 === null)) {
      break;
    }
    temp86 = {
    };
    code0.match(temp86);
    if((res0 === null)) {
      break;
    }
    if((res0 === null)) {
      break;
    } else {
      results0["start"] = res0;
    }
    res0 = grammar0["_"]();
    if((res0 === null)) {
      break;
    }
    while(true) {
      res0 = null;
      pos0 = code0.pos;
      temp87 = {
      };
      code0.match(temp87);
      if((res0 === null)) {
        code0.pos = pos0;
      } else {
        break;
      }
      pos0 = code0.pos;
      temp88 = {
      };
      code0.match(temp88);
      if((res0 === null)) {
        code0.pos = pos0;
      } else {
        break;
      }
      break;
    }
    if((res0 === null)) {
      break;
    } else {
      results0["type"] = res0;
    }
    if((res0 === null)) {
      break;
    } else {
      results0["end"] = res0;
    }
    res0 = grammar0["_"]();
    if((res0 === null)) {
      break;
    }
    temp89 = {
    };
    code0.match(temp89);
    if((res0 === null)) {
      break;
    }
    if((res0 === null)) {
      break;
    } else {
      results0["by"] = res0;
    }
    result0 = results0;
    break;
  }
  return result0;
};
grammar0["ARR_EXPL"] = function() {
  while(true) {
    matches0 = [];
    pos0 = code0.pos;
    outer:
    while(true) {
      while(true) {
        pos1 = code0.pos;
        temp90 = {
        };
        code0.match(temp90);
        if((res1 === null)) {
          res1 = undefined;
          code0.pos = pos1;
        }
        if((res1 === null)) {
          break;
        } else {
          results0 = _.extend(res1, results0);
        }
        if((res1 === null)) {
          break;
        } else {
          results0["splat"] = res1;
        }
        resV0 = results0;
        break;
      }
      if((resV0 === null)) {
        res0 = [];
        break outer;
      }
      matches0.push(resV0);
      inner:
      while(true) {
        pos1 = code0.pos;
        while(true) {
          resJ0 = null;
          pos2 = code0.pos;
          resJ0 = grammar0["_COMMA"]();
          if((resJ0 === null)) {
            code0.pos = pos2;
          } else {
            break;
          }
          pos2 = code0.pos;
          resJ0 = grammar0["_SOFTLINE"]();
          if((resJ0 === null)) {
            code0.pos = pos2;
          } else {
            break;
          }
          break;
        }
        if((resJ0 === null)) {
          code0.pos = pos1;
          break inner;
        }
        while(true) {
          pos2 = code0.pos;
          temp91 = {
          };
          code0.match(temp91);
          if((res1 === null)) {
            res1 = undefined;
            code0.pos = pos2;
          }
          if((res1 === null)) {
            break;
          } else {
            results0 = _.extend(res1, results0);
          }
          if((res1 === null)) {
            break;
          } else {
            results0["splat"] = res1;
          }
          resV0 = results0;
          break;
        }
        if((resV0 === null)) {
          code0.pos = pos1;
          break inner;
        }
        matches0.push(resV0);
      }
      break outer;
    }
    res0 = matches0;
    if((res0 === null)) {
      result0 = null;
      break;
    }
    if((res0 === null)) {
      result0 = null;
      break;
    }
    result0 = res0;
    if((res0 === null)) {
      result0 = null;
      break;
    }
    res0 = grammar0["___"]();
    if((res0 === null)) {
      result0 = null;
      break;
    }
    temp92 = {
    };
    code0.match(temp92);
    if((res0 === null)) {
      result0 = null;
      break;
    }
    break;
  }
  return result0;
};
grammar0["OBJ_EXPL"] = function() {
  while(true) {
    matches0 = [];
    pos0 = code0.pos;
    outer:
    while(true) {
      resV0 = grammar0["OBJ_EXPL_ITEM"]();
      if((resV0 === null)) {
        res0 = [];
        break outer;
      }
      matches0.push(resV0);
      inner:
      while(true) {
        pos1 = code0.pos;
        while(true) {
          resJ0 = null;
          pos2 = code0.pos;
          resJ0 = grammar0["_COMMA"]();
          if((resJ0 === null)) {
            code0.pos = pos2;
          } else {
            break;
          }
          pos2 = code0.pos;
          resJ0 = grammar0["_SOFTLINE"]();
          if((resJ0 === null)) {
            code0.pos = pos2;
          } else {
            break;
          }
          break;
        }
        if((resJ0 === null)) {
          code0.pos = pos1;
          break inner;
        }
        resV0 = grammar0["OBJ_EXPL_ITEM"]();
        if((resV0 === null)) {
          code0.pos = pos1;
          break inner;
        }
        matches0.push(resV0);
      }
      break outer;
    }
    res0 = matches0;
    if((res0 === null)) {
      result0 = null;
      break;
    }
    if((res0 === null)) {
      result0 = null;
      break;
    }
    result0 = res0;
    if((res0 === null)) {
      result0 = null;
      break;
    }
    res0 = grammar0["___"]();
    if((res0 === null)) {
      result0 = null;
      break;
    }
    temp93 = {
    };
    code0.match(temp93);
    if((res0 === null)) {
      result0 = null;
      break;
    }
    break;
  }
  return result0;
};
grammar0["OBJ_EXPL_ITEM"] = function() {
  while(true) {
    pos0 = code0.pos;
    while(true) {
      res0 = undefined;
      res1 = grammar0["_"]();
      if((res1 === null)) {
        res0 = null;
        break;
      }
      temp94 = {
      };
      code0.match(temp94);
      if((res1 === null)) {
        res0 = null;
        break;
      }
      res1 = grammar0["LINEEXPR"]();
      res0 = res1;
      if((res1 === null)) {
        res0 = null;
        break;
      }
      break;
    }
    if((res0 === null)) {
      res0 = undefined;
      code0.pos = pos0;
    }
    if((res0 === null)) {
      break;
    } else {
      results0["key"] = res0;
    }
    if((res0 === null)) {
      break;
    } else {
      results0["value"] = res0;
    }
    result0 = results0;
    break;
  }
  return result0;
};
grammar0["PAREN"] = function() {
  while(true) {
    result0 = undefined;
    res0 = grammar0["_"]();
    if((res0 === null)) {
      result0 = null;
      break;
    }
    temp95 = {
    };
    code0.match(temp95);
    if((res0 === null)) {
      result0 = null;
      break;
    }
    res0 = grammar0["___"]();
    if((res0 === null)) {
      result0 = null;
      break;
    }
    res0 = grammar0["LINEEXPR"]();
    result0 = res0;
    if((res0 === null)) {
      result0 = null;
      break;
    }
    res0 = grammar0["___"]();
    if((res0 === null)) {
      result0 = null;
      break;
    }
    temp96 = {
    };
    code0.match(temp96);
    if((res0 === null)) {
      result0 = null;
      break;
    }
    break;
  }
  return result0;
};
grammar0["PROPERTY"] = function() {
  while(true) {
    result0 = undefined;
    res0 = grammar0["_"]();
    if((res0 === null)) {
      result0 = null;
      break;
    }
    temp97 = {
    };
    code0.match(temp97);
    if((res0 === null)) {
      result0 = null;
      break;
    }
    while(true) {
      res0 = null;
      pos0 = code0.pos;
      res0 = grammar0["WORD"]();
      if((res0 === null)) {
        code0.pos = pos0;
      } else {
        break;
      }
      pos0 = code0.pos;
      res0 = grammar0["STRING"]();
      if((res0 === null)) {
        code0.pos = pos0;
      } else {
        break;
      }
      break;
    }
    result0 = res0;
    if((res0 === null)) {
      result0 = null;
      break;
    }
    break;
  }
  return result0;
};
grammar0["THIS"] = function() {
  while(true) {
    result0 = undefined;
    res0 = grammar0["_"]();
    if((res0 === null)) {
      result0 = null;
      break;
    }
    temp98 = {
    };
    code0.match(temp98);
    if((res0 === null)) {
      result0 = null;
      break;
    }
    break;
  }
  return result0;
};
grammar0["REGEX"] = function() {
  while(true) {
    matches0 = [];
    pos0 = code0.pos;
    outer:
    while(true) {
      while(true) {
        pos1 = code0.pos;
        res2 = grammar0["_FSLASH"]();
        code0.pos = pos1;
        if((res2 !== null)) {
          res1 = null;
        } else {
          res1 = undefined;
        }
        if((res1 === null)) {
          resV0 = null;
          break;
        }
        while(true) {
          res1 = null;
          pos1 = code0.pos;
          res1 = grammar0["ESC2"]();
          if((res1 === null)) {
            code0.pos = pos1;
          } else {
            break;
          }
          pos1 = code0.pos;
          res1 = grammar0["."]();
          if((res1 === null)) {
            code0.pos = pos1;
          } else {
            break;
          }
          break;
        }
        resV0 = res1;
        if((res1 === null)) {
          resV0 = null;
          break;
        }
        break;
      }
      if((resV0 === null)) {
        res0 = [];
        break outer;
      }
      matches0.push(resV0);
      inner:
      while(true) {
        pos1 = code0.pos;
        while(true) {
          pos2 = code0.pos;
          res2 = grammar0["_FSLASH"]();
          code0.pos = pos2;
          if((res2 !== null)) {
            res1 = null;
          } else {
            res1 = undefined;
          }
          if((res1 === null)) {
            resV0 = null;
            break;
          }
          while(true) {
            res1 = null;
            pos2 = code0.pos;
            res1 = grammar0["ESC2"]();
            if((res1 === null)) {
              code0.pos = pos2;
            } else {
              break;
            }
            pos2 = code0.pos;
            res1 = grammar0["."]();
            if((res1 === null)) {
              code0.pos = pos2;
            } else {
              break;
            }
            break;
          }
          resV0 = res1;
          if((res1 === null)) {
            resV0 = null;
            break;
          }
          break;
        }
        if((resV0 === null)) {
          code0.pos = pos1;
          break inner;
        }
        matches0.push(resV0);
      }
      break outer;
    }
    res0 = matches0;
    res0 = grammar0["_FSLASH"]();
    if((res0 === null)) {
      break;
    }
    if((res0 === null)) {
      break;
    } else {
      results0 = _.extend(res0, results0);
    }
    res0 = grammar0["_FSLASH"]();
    if((res0 === null)) {
      break;
    }
    temp99 = {
    };
    code0.peek(temp99);
    if((res0 === null)) {
      break;
    }
    temp100 = {
    };
    code0.match(temp100);
    if((res0 === null)) {
      break;
    } else {
      results0["flags"] = res0;
    }
    result0 = results0;
    break;
  }
  return result0;
};
grammar0["STRING"] = function() {
  while(true) {
    result0 = null;
    pos0 = code0.pos;
    while(true) {
      matches0 = [];
      pos1 = code0.pos;
      outer:
      while(true) {
        while(true) {
          pos2 = code0.pos;
          res2 = grammar0["_QUOTE"]();
          code0.pos = pos2;
          if((res2 !== null)) {
            res1 = null;
          } else {
            res1 = undefined;
          }
          if((res1 === null)) {
            resV0 = null;
            break;
          }
          while(true) {
            res1 = null;
            pos2 = code0.pos;
            res1 = grammar0["ESCSTR"]();
            if((res1 === null)) {
              code0.pos = pos2;
            } else {
              break;
            }
            pos2 = code0.pos;
            res1 = grammar0["."]();
            if((res1 === null)) {
              code0.pos = pos2;
            } else {
              break;
            }
            break;
          }
          resV0 = res1;
          if((res1 === null)) {
            resV0 = null;
            break;
          }
          break;
        }
        if((resV0 === null)) {
          res0 = [];
          break outer;
        }
        matches0.push(resV0);
        inner:
        while(true) {
          pos2 = code0.pos;
          while(true) {
            pos3 = code0.pos;
            res2 = grammar0["_QUOTE"]();
            code0.pos = pos3;
            if((res2 !== null)) {
              res1 = null;
            } else {
              res1 = undefined;
            }
            if((res1 === null)) {
              resV0 = null;
              break;
            }
            while(true) {
              res1 = null;
              pos3 = code0.pos;
              res1 = grammar0["ESCSTR"]();
              if((res1 === null)) {
                code0.pos = pos3;
              } else {
                break;
              }
              pos3 = code0.pos;
              res1 = grammar0["."]();
              if((res1 === null)) {
                code0.pos = pos3;
              } else {
                break;
              }
              break;
            }
            resV0 = res1;
            if((res1 === null)) {
              resV0 = null;
              break;
            }
            break;
          }
          if((resV0 === null)) {
            code0.pos = pos2;
            break inner;
          }
          matches0.push(resV0);
        }
        break outer;
      }
      res0 = matches0;
      if((res0 === null)) {
        result0 = null;
        break;
      }
      result0 = res0;
      if((res0 === null)) {
        result0 = null;
        break;
      }
      res0 = grammar0["_QUOTE"]();
      if((res0 === null)) {
        result0 = null;
        break;
      }
      break;
    }
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    pos0 = code0.pos;
    while(true) {
      matches0 = [];
      pos1 = code0.pos;
      outer:
      while(true) {
        while(true) {
          pos2 = code0.pos;
          res2 = grammar0["_TQUOTE"]();
          code0.pos = pos2;
          if((res2 !== null)) {
            res1 = null;
          } else {
            res1 = undefined;
          }
          if((res1 === null)) {
            resV0 = null;
            break;
          }
          while(true) {
            res1 = null;
            pos2 = code0.pos;
            res1 = grammar0["ESCSTR"]();
            if((res1 === null)) {
              code0.pos = pos2;
            } else {
              break;
            }
            pos2 = code0.pos;
            res1 = grammar0["INTERP"]();
            if((res1 === null)) {
              code0.pos = pos2;
            } else {
              break;
            }
            pos2 = code0.pos;
            res1 = grammar0["."]();
            if((res1 === null)) {
              code0.pos = pos2;
            } else {
              break;
            }
            break;
          }
          resV0 = res1;
          if((res1 === null)) {
            resV0 = null;
            break;
          }
          break;
        }
        if((resV0 === null)) {
          res0 = [];
          break outer;
        }
        matches0.push(resV0);
        inner:
        while(true) {
          pos2 = code0.pos;
          while(true) {
            pos3 = code0.pos;
            res2 = grammar0["_TQUOTE"]();
            code0.pos = pos3;
            if((res2 !== null)) {
              res1 = null;
            } else {
              res1 = undefined;
            }
            if((res1 === null)) {
              resV0 = null;
              break;
            }
            while(true) {
              res1 = null;
              pos3 = code0.pos;
              res1 = grammar0["ESCSTR"]();
              if((res1 === null)) {
                code0.pos = pos3;
              } else {
                break;
              }
              pos3 = code0.pos;
              res1 = grammar0["INTERP"]();
              if((res1 === null)) {
                code0.pos = pos3;
              } else {
                break;
              }
              pos3 = code0.pos;
              res1 = grammar0["."]();
              if((res1 === null)) {
                code0.pos = pos3;
              } else {
                break;
              }
              break;
            }
            resV0 = res1;
            if((res1 === null)) {
              resV0 = null;
              break;
            }
            break;
          }
          if((resV0 === null)) {
            code0.pos = pos2;
            break inner;
          }
          matches0.push(resV0);
        }
        break outer;
      }
      res0 = matches0;
      if((res0 === null)) {
        result0 = null;
        break;
      }
      result0 = res0;
      if((res0 === null)) {
        result0 = null;
        break;
      }
      res0 = grammar0["_TQUOTE"]();
      if((res0 === null)) {
        result0 = null;
        break;
      }
      break;
    }
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    pos0 = code0.pos;
    while(true) {
      matches0 = [];
      pos1 = code0.pos;
      outer:
      while(true) {
        while(true) {
          pos2 = code0.pos;
          res2 = grammar0["_DQUOTE"]();
          code0.pos = pos2;
          if((res2 !== null)) {
            res1 = null;
          } else {
            res1 = undefined;
          }
          if((res1 === null)) {
            resV0 = null;
            break;
          }
          while(true) {
            res1 = null;
            pos2 = code0.pos;
            res1 = grammar0["ESCSTR"]();
            if((res1 === null)) {
              code0.pos = pos2;
            } else {
              break;
            }
            pos2 = code0.pos;
            res1 = grammar0["INTERP"]();
            if((res1 === null)) {
              code0.pos = pos2;
            } else {
              break;
            }
            pos2 = code0.pos;
            res1 = grammar0["."]();
            if((res1 === null)) {
              code0.pos = pos2;
            } else {
              break;
            }
            break;
          }
          resV0 = res1;
          if((res1 === null)) {
            resV0 = null;
            break;
          }
          break;
        }
        if((resV0 === null)) {
          res0 = [];
          break outer;
        }
        matches0.push(resV0);
        inner:
        while(true) {
          pos2 = code0.pos;
          while(true) {
            pos3 = code0.pos;
            res2 = grammar0["_DQUOTE"]();
            code0.pos = pos3;
            if((res2 !== null)) {
              res1 = null;
            } else {
              res1 = undefined;
            }
            if((res1 === null)) {
              resV0 = null;
              break;
            }
            while(true) {
              res1 = null;
              pos3 = code0.pos;
              res1 = grammar0["ESCSTR"]();
              if((res1 === null)) {
                code0.pos = pos3;
              } else {
                break;
              }
              pos3 = code0.pos;
              res1 = grammar0["INTERP"]();
              if((res1 === null)) {
                code0.pos = pos3;
              } else {
                break;
              }
              pos3 = code0.pos;
              res1 = grammar0["."]();
              if((res1 === null)) {
                code0.pos = pos3;
              } else {
                break;
              }
              break;
            }
            resV0 = res1;
            if((res1 === null)) {
              resV0 = null;
              break;
            }
            break;
          }
          if((resV0 === null)) {
            code0.pos = pos2;
            break inner;
          }
          matches0.push(resV0);
        }
        break outer;
      }
      res0 = matches0;
      if((res0 === null)) {
        result0 = null;
        break;
      }
      result0 = res0;
      if((res0 === null)) {
        result0 = null;
        break;
      }
      res0 = grammar0["_DQUOTE"]();
      if((res0 === null)) {
        result0 = null;
        break;
      }
      break;
    }
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    break;
  }
  return result0;
};
grammar0["BOOLEAN"] = function() {
  while(true) {
    result0 = null;
    pos0 = code0.pos;
    result0 = grammar0["_TRUE"]();
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    pos0 = code0.pos;
    result0 = grammar0["_FALSE"]();
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    break;
  }
  return result0;
};
grammar0["NUMBER"] = function() {
  while(true) {
    result0 = undefined;
    res0 = grammar0["_"]();
    if((res0 === null)) {
      result0 = null;
      break;
    }
    temp101 = {
    };
    code0.peek(temp101);
    if((res0 === null)) {
      result0 = null;
      break;
    }
    temp102 = {
    };
    code0.match(temp102);
    result0 = res0;
    if((res0 === null)) {
      result0 = null;
      break;
    }
    break;
  }
  return result0;
};
grammar0["SYMBOL"] = function() {
  while(true) {
    pos0 = code0.pos;
    res1 = grammar0["_KEYWORD"]();
    code0.pos = pos0;
    if((res1 !== null)) {
      res0 = null;
    } else {
      res0 = undefined;
    }
    if((res0 === null)) {
      result0 = null;
      break;
    }
    res0 = grammar0["WORD"]();
    result0 = res0;
    if((res0 === null)) {
      result0 = null;
      break;
    }
    break;
  }
  return result0;
};
grammar0["BLOCK[0]"] = function() {
  while(true) {
    matches0 = [];
    pos0 = code0.pos;
    outer:
    while(true) {
      resV0 = grammar0["LINE"]();
      if((resV0 === null)) {
        res0 = [];
        break outer;
      }
      matches0.push(resV0);
      inner:
      while(true) {
        pos1 = code0.pos;
        resJ0 = grammar0["_NEWLINE"]();
        if((resJ0 === null)) {
          code0.pos = pos1;
          break inner;
        }
        resV0 = grammar0["LINE"]();
        if((resV0 === null)) {
          code0.pos = pos1;
          break inner;
        }
        matches0.push(resV0);
      }
      break outer;
    }
    res0 = matches0;
    result0 = res0;
    if((res0 === null)) {
      result0 = null;
      break;
    }
    break;
  }
  return result0;
};
grammar0["BLOCK[1]"] = function() {
  while(true) {
    matches0 = [];
    pos0 = code0.pos;
    outer:
    while(true) {
      resV0 = grammar0["LINE"]();
      if((resV0 === null)) {
        res0 = null;
        break outer;
      }
      matches0.push(resV0);
      inner:
      while(true) {
        pos1 = code0.pos;
        while(true) {
          resJ0 = undefined;
          res1 = grammar0["_"]();
          if((res1 === null)) {
            resJ0 = null;
            break;
          }
          temp103 = {
          };
          code0.match(temp103);
          if((res1 === null)) {
            resJ0 = null;
            break;
          }
          break;
        }
        if((resJ0 === null)) {
          code0.pos = pos1;
          break inner;
        }
        resV0 = grammar0["LINE"]();
        if((resV0 === null)) {
          code0.pos = pos1;
          break inner;
        }
        matches0.push(resV0);
      }
      if((1 > matches0.length)) {
        res0 = null;
        code0.pos = pos0;
        break outer;
      }
      break outer;
    }
    res0 = matches0;
    result0 = res0;
    if((res0 === null)) {
      result0 = null;
      break;
    }
    break;
  }
  return result0;
};
grammar0["_NEWLINE[0]"] = function() {
  while(true) {
    matches0 = [];
    pos0 = code0.pos;
    outer:
    while(true) {
      resV0 = grammar0["_BLANKLINE"]();
      if((resV0 === null)) {
        res0 = null;
        break outer;
      }
      matches0.push(resV0);
      inner:
      while(true) {
        pos1 = code0.pos;
        resV0 = grammar0["_BLANKLINE"]();
        if((resV0 === null)) {
          code0.pos = pos1;
          break inner;
        }
        matches0.push(resV0);
      }
      if((1 > matches0.length)) {
        res0 = null;
        code0.pos = pos0;
        break outer;
      }
      break outer;
    }
    res0 = matches0;
    if((res0 === null)) {
      break;
    }
    res0 = grammar0["_"]();
    if((res0 === null)) {
      break;
    } else {
      results0 = _.extend(res0, results0);
    }
    result0 = results0;
    break;
  }
  return result0;
};
grammar0["_NEWLINE[1]"] = function() {
  while(true) {
    result0 = undefined;
    res0 = grammar0["_"]();
    if((res0 === null)) {
      result0 = null;
      break;
    }
    temp104 = {
    };
    code0.match(temp104);
    if((res0 === null)) {
      result0 = null;
      break;
    }
    break;
  }
  return result0;
};
grammar0["_IF"] = function() {
  while(true) {
    pos0 = code0.pos;
    temp105 = {
    };
    code0.match(temp105);
    code0.pos = pos0;
    if((res1 !== null)) {
      res0 = null;
    } else {
      res0 = undefined;
    }
    temp106 = {
    };
    code0.match(temp106);
    if((res0 === null)) {
      break;
    } else {
      results0 = _.extend(res0, results0);
    }
    temp107 = {
    };
    code0.peek(temp107);
    if((res0 === null)) {
      break;
    }
    if((res0 === null)) {
      break;
    }
    result0 = results0;
    break;
  }
  return result0;
};
grammar0["_UNLESS"] = function() {
  while(true) {
    pos0 = code0.pos;
    temp108 = {
    };
    code0.match(temp108);
    code0.pos = pos0;
    if((res1 !== null)) {
      res0 = null;
    } else {
      res0 = undefined;
    }
    temp109 = {
    };
    code0.match(temp109);
    if((res0 === null)) {
      break;
    } else {
      results0 = _.extend(res0, results0);
    }
    temp110 = {
    };
    code0.peek(temp110);
    if((res0 === null)) {
      break;
    }
    if((res0 === null)) {
      break;
    }
    result0 = results0;
    break;
  }
  return result0;
};
grammar0["_ELSE"] = function() {
  while(true) {
    pos0 = code0.pos;
    temp111 = {
    };
    code0.match(temp111);
    code0.pos = pos0;
    if((res1 !== null)) {
      res0 = null;
    } else {
      res0 = undefined;
    }
    temp112 = {
    };
    code0.match(temp112);
    if((res0 === null)) {
      break;
    } else {
      results0 = _.extend(res0, results0);
    }
    temp113 = {
    };
    code0.peek(temp113);
    if((res0 === null)) {
      break;
    }
    if((res0 === null)) {
      break;
    }
    result0 = results0;
    break;
  }
  return result0;
};
grammar0["_FOR"] = function() {
  while(true) {
    pos0 = code0.pos;
    temp114 = {
    };
    code0.match(temp114);
    code0.pos = pos0;
    if((res1 !== null)) {
      res0 = null;
    } else {
      res0 = undefined;
    }
    temp115 = {
    };
    code0.match(temp115);
    if((res0 === null)) {
      break;
    } else {
      results0 = _.extend(res0, results0);
    }
    temp116 = {
    };
    code0.peek(temp116);
    if((res0 === null)) {
      break;
    }
    if((res0 === null)) {
      break;
    }
    result0 = results0;
    break;
  }
  return result0;
};
grammar0["_OWN"] = function() {
  while(true) {
    pos0 = code0.pos;
    temp117 = {
    };
    code0.match(temp117);
    code0.pos = pos0;
    if((res1 !== null)) {
      res0 = null;
    } else {
      res0 = undefined;
    }
    temp118 = {
    };
    code0.match(temp118);
    if((res0 === null)) {
      break;
    } else {
      results0 = _.extend(res0, results0);
    }
    temp119 = {
    };
    code0.peek(temp119);
    if((res0 === null)) {
      break;
    }
    if((res0 === null)) {
      break;
    }
    result0 = results0;
    break;
  }
  return result0;
};
grammar0["_IN"] = function() {
  while(true) {
    pos0 = code0.pos;
    temp120 = {
    };
    code0.match(temp120);
    code0.pos = pos0;
    if((res1 !== null)) {
      res0 = null;
    } else {
      res0 = undefined;
    }
    temp121 = {
    };
    code0.match(temp121);
    if((res0 === null)) {
      break;
    } else {
      results0 = _.extend(res0, results0);
    }
    temp122 = {
    };
    code0.peek(temp122);
    if((res0 === null)) {
      break;
    }
    if((res0 === null)) {
      break;
    }
    result0 = results0;
    break;
  }
  return result0;
};
grammar0["_OF"] = function() {
  while(true) {
    pos0 = code0.pos;
    temp123 = {
    };
    code0.match(temp123);
    code0.pos = pos0;
    if((res1 !== null)) {
      res0 = null;
    } else {
      res0 = undefined;
    }
    temp124 = {
    };
    code0.match(temp124);
    if((res0 === null)) {
      break;
    } else {
      results0 = _.extend(res0, results0);
    }
    temp125 = {
    };
    code0.peek(temp125);
    if((res0 === null)) {
      break;
    }
    if((res0 === null)) {
      break;
    }
    result0 = results0;
    break;
  }
  return result0;
};
grammar0["_LOOP"] = function() {
  while(true) {
    pos0 = code0.pos;
    temp126 = {
    };
    code0.match(temp126);
    code0.pos = pos0;
    if((res1 !== null)) {
      res0 = null;
    } else {
      res0 = undefined;
    }
    temp127 = {
    };
    code0.match(temp127);
    if((res0 === null)) {
      break;
    } else {
      results0 = _.extend(res0, results0);
    }
    temp128 = {
    };
    code0.peek(temp128);
    if((res0 === null)) {
      break;
    }
    if((res0 === null)) {
      break;
    }
    result0 = results0;
    break;
  }
  return result0;
};
grammar0["_WHILE"] = function() {
  while(true) {
    pos0 = code0.pos;
    temp129 = {
    };
    code0.match(temp129);
    code0.pos = pos0;
    if((res1 !== null)) {
      res0 = null;
    } else {
      res0 = undefined;
    }
    temp130 = {
    };
    code0.match(temp130);
    if((res0 === null)) {
      break;
    } else {
      results0 = _.extend(res0, results0);
    }
    temp131 = {
    };
    code0.peek(temp131);
    if((res0 === null)) {
      break;
    }
    if((res0 === null)) {
      break;
    }
    result0 = results0;
    break;
  }
  return result0;
};
grammar0["_BREAK"] = function() {
  while(true) {
    pos0 = code0.pos;
    temp132 = {
    };
    code0.match(temp132);
    code0.pos = pos0;
    if((res1 !== null)) {
      res0 = null;
    } else {
      res0 = undefined;
    }
    temp133 = {
    };
    code0.match(temp133);
    if((res0 === null)) {
      break;
    } else {
      results0 = _.extend(res0, results0);
    }
    temp134 = {
    };
    code0.peek(temp134);
    if((res0 === null)) {
      break;
    }
    if((res0 === null)) {
      break;
    }
    result0 = results0;
    break;
  }
  return result0;
};
grammar0["_CONTINUE"] = function() {
  while(true) {
    pos0 = code0.pos;
    temp135 = {
    };
    code0.match(temp135);
    code0.pos = pos0;
    if((res1 !== null)) {
      res0 = null;
    } else {
      res0 = undefined;
    }
    temp136 = {
    };
    code0.match(temp136);
    if((res0 === null)) {
      break;
    } else {
      results0 = _.extend(res0, results0);
    }
    temp137 = {
    };
    code0.peek(temp137);
    if((res0 === null)) {
      break;
    }
    if((res0 === null)) {
      break;
    }
    result0 = results0;
    break;
  }
  return result0;
};
grammar0["_SWITCH"] = function() {
  while(true) {
    pos0 = code0.pos;
    temp138 = {
    };
    code0.match(temp138);
    code0.pos = pos0;
    if((res1 !== null)) {
      res0 = null;
    } else {
      res0 = undefined;
    }
    temp139 = {
    };
    code0.match(temp139);
    if((res0 === null)) {
      break;
    } else {
      results0 = _.extend(res0, results0);
    }
    temp140 = {
    };
    code0.peek(temp140);
    if((res0 === null)) {
      break;
    }
    if((res0 === null)) {
      break;
    }
    result0 = results0;
    break;
  }
  return result0;
};
grammar0["_WHEN"] = function() {
  while(true) {
    pos0 = code0.pos;
    temp141 = {
    };
    code0.match(temp141);
    code0.pos = pos0;
    if((res1 !== null)) {
      res0 = null;
    } else {
      res0 = undefined;
    }
    temp142 = {
    };
    code0.match(temp142);
    if((res0 === null)) {
      break;
    } else {
      results0 = _.extend(res0, results0);
    }
    temp143 = {
    };
    code0.peek(temp143);
    if((res0 === null)) {
      break;
    }
    if((res0 === null)) {
      break;
    }
    result0 = results0;
    break;
  }
  return result0;
};
grammar0["_RETURN"] = function() {
  while(true) {
    pos0 = code0.pos;
    temp144 = {
    };
    code0.match(temp144);
    code0.pos = pos0;
    if((res1 !== null)) {
      res0 = null;
    } else {
      res0 = undefined;
    }
    temp145 = {
    };
    code0.match(temp145);
    if((res0 === null)) {
      break;
    } else {
      results0 = _.extend(res0, results0);
    }
    temp146 = {
    };
    code0.peek(temp146);
    if((res0 === null)) {
      break;
    }
    if((res0 === null)) {
      break;
    }
    result0 = results0;
    break;
  }
  return result0;
};
grammar0["_THROW"] = function() {
  while(true) {
    pos0 = code0.pos;
    temp147 = {
    };
    code0.match(temp147);
    code0.pos = pos0;
    if((res1 !== null)) {
      res0 = null;
    } else {
      res0 = undefined;
    }
    temp148 = {
    };
    code0.match(temp148);
    if((res0 === null)) {
      break;
    } else {
      results0 = _.extend(res0, results0);
    }
    temp149 = {
    };
    code0.peek(temp149);
    if((res0 === null)) {
      break;
    }
    if((res0 === null)) {
      break;
    }
    result0 = results0;
    break;
  }
  return result0;
};
grammar0["_THEN"] = function() {
  while(true) {
    pos0 = code0.pos;
    temp150 = {
    };
    code0.match(temp150);
    code0.pos = pos0;
    if((res1 !== null)) {
      res0 = null;
    } else {
      res0 = undefined;
    }
    temp151 = {
    };
    code0.match(temp151);
    if((res0 === null)) {
      break;
    } else {
      results0 = _.extend(res0, results0);
    }
    temp152 = {
    };
    code0.peek(temp152);
    if((res0 === null)) {
      break;
    }
    if((res0 === null)) {
      break;
    }
    result0 = results0;
    break;
  }
  return result0;
};
grammar0["_IS"] = function() {
  while(true) {
    pos0 = code0.pos;
    temp153 = {
    };
    code0.match(temp153);
    code0.pos = pos0;
    if((res1 !== null)) {
      res0 = null;
    } else {
      res0 = undefined;
    }
    temp154 = {
    };
    code0.match(temp154);
    if((res0 === null)) {
      break;
    } else {
      results0 = _.extend(res0, results0);
    }
    temp155 = {
    };
    code0.peek(temp155);
    if((res0 === null)) {
      break;
    }
    if((res0 === null)) {
      break;
    }
    result0 = results0;
    break;
  }
  return result0;
};
grammar0["_ISNT"] = function() {
  while(true) {
    pos0 = code0.pos;
    temp156 = {
    };
    code0.match(temp156);
    code0.pos = pos0;
    if((res1 !== null)) {
      res0 = null;
    } else {
      res0 = undefined;
    }
    temp157 = {
    };
    code0.match(temp157);
    if((res0 === null)) {
      break;
    } else {
      results0 = _.extend(res0, results0);
    }
    temp158 = {
    };
    code0.peek(temp158);
    if((res0 === null)) {
      break;
    }
    if((res0 === null)) {
      break;
    }
    result0 = results0;
    break;
  }
  return result0;
};
grammar0["_TRUE"] = function() {
  while(true) {
    pos0 = code0.pos;
    temp159 = {
    };
    code0.match(temp159);
    code0.pos = pos0;
    if((res1 !== null)) {
      res0 = null;
    } else {
      res0 = undefined;
    }
    temp160 = {
    };
    code0.match(temp160);
    if((res0 === null)) {
      break;
    } else {
      results0 = _.extend(res0, results0);
    }
    temp161 = {
    };
    code0.peek(temp161);
    if((res0 === null)) {
      break;
    }
    if((res0 === null)) {
      break;
    }
    result0 = results0;
    break;
  }
  return result0;
};
grammar0["_FALSE"] = function() {
  while(true) {
    pos0 = code0.pos;
    temp162 = {
    };
    code0.match(temp162);
    code0.pos = pos0;
    if((res1 !== null)) {
      res0 = null;
    } else {
      res0 = undefined;
    }
    temp163 = {
    };
    code0.match(temp163);
    if((res0 === null)) {
      break;
    } else {
      results0 = _.extend(res0, results0);
    }
    temp164 = {
    };
    code0.peek(temp164);
    if((res0 === null)) {
      break;
    }
    if((res0 === null)) {
      break;
    }
    result0 = results0;
    break;
  }
  return result0;
};
grammar0["_BY"] = function() {
  while(true) {
    pos0 = code0.pos;
    temp165 = {
    };
    code0.match(temp165);
    code0.pos = pos0;
    if((res1 !== null)) {
      res0 = null;
    } else {
      res0 = undefined;
    }
    temp166 = {
    };
    code0.match(temp166);
    if((res0 === null)) {
      break;
    } else {
      results0 = _.extend(res0, results0);
    }
    temp167 = {
    };
    code0.peek(temp167);
    if((res0 === null)) {
      break;
    }
    if((res0 === null)) {
      break;
    }
    result0 = results0;
    break;
  }
  return result0;
};
grammar0["_NOT"] = function() {
  while(true) {
    pos0 = code0.pos;
    temp168 = {
    };
    code0.match(temp168);
    code0.pos = pos0;
    if((res1 !== null)) {
      res0 = null;
    } else {
      res0 = undefined;
    }
    temp169 = {
    };
    code0.match(temp169);
    if((res0 === null)) {
      break;
    } else {
      results0 = _.extend(res0, results0);
    }
    temp170 = {
    };
    code0.peek(temp170);
    if((res0 === null)) {
      break;
    }
    if((res0 === null)) {
      break;
    }
    result0 = results0;
    break;
  }
  return result0;
};
grammar0["_AND"] = function() {
  while(true) {
    pos0 = code0.pos;
    temp171 = {
    };
    code0.match(temp171);
    code0.pos = pos0;
    if((res1 !== null)) {
      res0 = null;
    } else {
      res0 = undefined;
    }
    temp172 = {
    };
    code0.match(temp172);
    if((res0 === null)) {
      break;
    } else {
      results0 = _.extend(res0, results0);
    }
    temp173 = {
    };
    code0.peek(temp173);
    if((res0 === null)) {
      break;
    }
    if((res0 === null)) {
      break;
    }
    result0 = results0;
    break;
  }
  return result0;
};
grammar0["_OR"] = function() {
  while(true) {
    pos0 = code0.pos;
    temp174 = {
    };
    code0.match(temp174);
    code0.pos = pos0;
    if((res1 !== null)) {
      res0 = null;
    } else {
      res0 = undefined;
    }
    temp175 = {
    };
    code0.match(temp175);
    if((res0 === null)) {
      break;
    } else {
      results0 = _.extend(res0, results0);
    }
    temp176 = {
    };
    code0.peek(temp176);
    if((res0 === null)) {
      break;
    }
    if((res0 === null)) {
      break;
    }
    result0 = results0;
    break;
  }
  return result0;
};
grammar0["_INSTANCEOF"] = function() {
  while(true) {
    pos0 = code0.pos;
    temp177 = {
    };
    code0.match(temp177);
    code0.pos = pos0;
    if((res1 !== null)) {
      res0 = null;
    } else {
      res0 = undefined;
    }
    temp178 = {
    };
    code0.match(temp178);
    if((res0 === null)) {
      break;
    } else {
      results0 = _.extend(res0, results0);
    }
    temp179 = {
    };
    code0.peek(temp179);
    if((res0 === null)) {
      break;
    }
    if((res0 === null)) {
      break;
    }
    result0 = results0;
    break;
  }
  return result0;
};
grammar0["_TYPEOF"] = function() {
  while(true) {
    pos0 = code0.pos;
    temp180 = {
    };
    code0.match(temp180);
    code0.pos = pos0;
    if((res1 !== null)) {
      res0 = null;
    } else {
      res0 = undefined;
    }
    temp181 = {
    };
    code0.match(temp181);
    if((res0 === null)) {
      break;
    } else {
      results0 = _.extend(res0, results0);
    }
    temp182 = {
    };
    code0.peek(temp182);
    if((res0 === null)) {
      break;
    }
    if((res0 === null)) {
      break;
    }
    result0 = results0;
    break;
  }
  return result0;
};
grammar0["_TRY"] = function() {
  while(true) {
    pos0 = code0.pos;
    temp183 = {
    };
    code0.match(temp183);
    code0.pos = pos0;
    if((res1 !== null)) {
      res0 = null;
    } else {
      res0 = undefined;
    }
    temp184 = {
    };
    code0.match(temp184);
    if((res0 === null)) {
      break;
    } else {
      results0 = _.extend(res0, results0);
    }
    temp185 = {
    };
    code0.peek(temp185);
    if((res0 === null)) {
      break;
    }
    if((res0 === null)) {
      break;
    }
    result0 = results0;
    break;
  }
  return result0;
};
grammar0["_CATCH"] = function() {
  while(true) {
    pos0 = code0.pos;
    temp186 = {
    };
    code0.match(temp186);
    code0.pos = pos0;
    if((res1 !== null)) {
      res0 = null;
    } else {
      res0 = undefined;
    }
    temp187 = {
    };
    code0.match(temp187);
    if((res0 === null)) {
      break;
    } else {
      results0 = _.extend(res0, results0);
    }
    temp188 = {
    };
    code0.peek(temp188);
    if((res0 === null)) {
      break;
    }
    if((res0 === null)) {
      break;
    }
    result0 = results0;
    break;
  }
  return result0;
};
grammar0["_FINALLY"] = function() {
  while(true) {
    pos0 = code0.pos;
    temp189 = {
    };
    code0.match(temp189);
    code0.pos = pos0;
    if((res1 !== null)) {
      res0 = null;
    } else {
      res0 = undefined;
    }
    temp190 = {
    };
    code0.match(temp190);
    if((res0 === null)) {
      break;
    } else {
      results0 = _.extend(res0, results0);
    }
    temp191 = {
    };
    code0.peek(temp191);
    if((res0 === null)) {
      break;
    }
    if((res0 === null)) {
      break;
    }
    result0 = results0;
    break;
  }
  return result0;
};
grammar0["__grammar__[0]"] = function() {
  while(true) {
    matches0 = [];
    pos0 = code0.pos;
    outer:
    while(true) {
      resV0 = grammar0["_BLANKLINE"]();
      if((resV0 === null)) {
        res0 = [];
        break outer;
      }
      matches0.push(resV0);
      inner:
      while(true) {
        pos1 = code0.pos;
        resV0 = grammar0["_BLANKLINE"]();
        if((resV0 === null)) {
          code0.pos = pos1;
          break inner;
        }
        matches0.push(resV0);
      }
      break outer;
    }
    res0 = matches0;
    if((res0 === null)) {
      result0 = null;
      break;
    }
    res0 = grammar0["LINES"]();
    result0 = res0;
    if((res0 === null)) {
      result0 = null;
      break;
    }
    res0 = grammar0["___"]();
    if((res0 === null)) {
      result0 = null;
      break;
    }
    break;
  }
  return result0;
};
grammar0["LINES"] = function() {
  matches0 = [];
  pos0 = code0.pos;
  outer:
  while(true) {
    resV0 = grammar0["LINE"]();
    if((resV0 === null)) {
      result0 = [];
      break outer;
    }
    matches0.push(resV0);
    inner:
    while(true) {
      pos1 = code0.pos;
      resJ0 = grammar0["_NEWLINE"]();
      if((resJ0 === null)) {
        code0.pos = pos1;
        break inner;
      }
      resV0 = grammar0["LINE"]();
      if((resV0 === null)) {
        code0.pos = pos1;
        break inner;
      }
      matches0.push(resV0);
    }
    break outer;
  }
  result0 = matches0;
  return result0;
};
grammar0["LINE"] = function() {
  while(true) {
    result0 = null;
    pos0 = code0.pos;
    while(true) {
      matches0 = [];
      pos1 = code0.pos;
      outer:
      while(true) {
        while(true) {
          pos2 = code0.pos;
          temp192 = {
          };
          code0.match(temp192);
          code0.pos = pos2;
          if((res2 !== null)) {
            res1 = null;
          } else {
            res1 = undefined;
          }
          if((res1 === null)) {
            resV0 = null;
            break;
          }
          res1 = grammar0["."]();
          resV0 = res1;
          if((res1 === null)) {
            resV0 = null;
            break;
          }
          break;
        }
        if((resV0 === null)) {
          res0 = [];
          break outer;
        }
        matches0.push(resV0);
        inner:
        while(true) {
          pos2 = code0.pos;
          while(true) {
            pos3 = code0.pos;
            temp193 = {
            };
            code0.match(temp193);
            code0.pos = pos3;
            if((res2 !== null)) {
              res1 = null;
            } else {
              res1 = undefined;
            }
            if((res1 === null)) {
              resV0 = null;
              break;
            }
            res1 = grammar0["."]();
            resV0 = res1;
            if((res1 === null)) {
              resV0 = null;
              break;
            }
            break;
          }
          if((resV0 === null)) {
            code0.pos = pos2;
            break inner;
          }
          matches0.push(resV0);
        }
        break outer;
      }
      res0 = matches0;
      if((res0 === null)) {
        result0 = null;
        break;
      }
      if((res0 === null)) {
        result0 = null;
        break;
      }
      result0 = res0;
      if((res0 === null)) {
        result0 = null;
        break;
      }
      temp194 = {
      };
      code0.match(temp194);
      if((res0 === null)) {
        result0 = null;
        break;
      }
      break;
    }
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    pos0 = code0.pos;
    while(true) {
      result0 = null;
      pos1 = code0.pos;
      while(true) {
        result0 = undefined;
        results0 = {
        };
        res0 = grammar0["LINEEXPR"]();
        if((res0 === null)) {
          break;
        } else {
          results0["block"] = res0;
        }
        res0 = grammar0["_IF"]();
        if((res0 === null)) {
          break;
        }
        res0 = grammar0["EXPR"]();
        if((res0 === null)) {
          break;
        } else {
          results0["cond"] = res0;
        }
        result0 = results0;
        break;
      }
      if((result0 === null)) {
        code0.pos = pos1;
      } else {
        break;
      }
      pos1 = code0.pos;
      while(true) {
        result0 = undefined;
        results0 = {
        };
        res0 = grammar0["LINEEXPR"]();
        if((res0 === null)) {
          break;
        } else {
          results0["block"] = res0;
        }
        res0 = grammar0["_UNLESS"]();
        if((res0 === null)) {
          break;
        }
        res0 = grammar0["EXPR"]();
        if((res0 === null)) {
          break;
        } else {
          results0["cond"] = res0;
        }
        result0 = results0;
        break;
      }
      if((result0 === null)) {
        code0.pos = pos1;
      } else {
        break;
      }
      pos1 = code0.pos;
      while(true) {
        pos2 = code0.pos;
        while(true) {
          res0 = undefined;
          results1 = {
          };
          res1 = grammar0["_WHEN"]();
          if((res1 === null)) {
            break;
          }
          res1 = grammar0["EXPR"]();
          if((res1 === null)) {
            break;
          } else {
            results1["cond"] = res1;
          }
          res0 = results1;
          break;
        }
        if((res0 === null)) {
          res0 = undefined;
          code0.pos = pos2;
        }
        res0 = matches0;
        res0 = grammar0["_FOR"]();
        if((res0 === null)) {
          break;
        }
        if((res0 === null)) {
          break;
        } else {
          results0["own"] = res0;
        }
        if((res0 === null)) {
          break;
        } else {
          results0["keys"] = res0;
        }
        while(true) {
          res0 = null;
          pos2 = code0.pos;
          res0 = grammar0["_IN"]();
          if((res0 === null)) {
            code0.pos = pos2;
          } else {
            break;
          }
          pos2 = code0.pos;
          res0 = grammar0["_OF"]();
          if((res0 === null)) {
            code0.pos = pos2;
          } else {
            break;
          }
          break;
        }
        if((res0 === null)) {
          break;
        } else {
          results0["type"] = res0;
        }
        res0 = grammar0["EXPR"]();
        if((res0 === null)) {
          break;
        } else {
          results0["obj"] = res0;
        }
        if((res0 === null)) {
          break;
        } else {
          _.extend(results0, res0);
        }
        result0 = results0;
        break;
      }
      if((result0 === null)) {
        code0.pos = pos1;
      } else {
        break;
      }
      pos1 = code0.pos;
      while(true) {
        pos2 = code0.pos;
        res0 = grammar0["EXPR"]();
        if((res0 === null)) {
          res0 = undefined;
          code0.pos = pos2;
        }
        if((res0 === null)) {
          break;
        } else {
          results0["type"] = res0;
        }
        if((res0 === null)) {
          break;
        } else {
          results0["expr"] = res0;
        }
        result0 = results0;
        break;
      }
      if((result0 === null)) {
        code0.pos = pos1;
      } else {
        break;
      }
      pos1 = code0.pos;
      while(true) {
        result0 = null;
        pos2 = code0.pos;
        while(true) {
          pos3 = code0.pos;
          res0 = grammar0["BLOCK"]();
          if((res0 === null)) {
            res0 = undefined;
            code0.pos = pos3;
          }
          if((res0 === null)) {
            break;
          } else {
            results0["params"] = res0;
          }
          res0 = grammar0["_"]();
          if((res0 === null)) {
            break;
          }
          while(true) {
            res0 = null;
            pos3 = code0.pos;
            temp195 = {
            };
            code0.match(temp195);
            if((res0 === null)) {
              code0.pos = pos3;
            } else {
              break;
            }
            pos3 = code0.pos;
            temp196 = {
            };
            code0.match(temp196);
            if((res0 === null)) {
              code0.pos = pos3;
            } else {
              break;
            }
            break;
          }
          if((res0 === null)) {
            break;
          } else {
            results0["type"] = res0;
          }
          if((res0 === null)) {
            break;
          } else {
            results0["block"] = res0;
          }
          result0 = results0;
          break;
        }
        if((result0 === null)) {
          code0.pos = pos2;
        } else {
          break;
        }
        pos2 = code0.pos;
        while(true) {
          result0 = null;
          pos3 = code0.pos;
          while(true) {
            matches0 = [];
            pos4 = code0.pos;
            outer:
            while(true) {
              while(true) {
                pos5 = code0.pos;
                temp197 = {
                };
                code0.match(temp197);
                if((res1 === null)) {
                  res1 = undefined;
                  code0.pos = pos5;
                }
                if((res1 === null)) {
                  break;
                } else {
                  results1 = _.extend(res1, results1);
                }
                if((res1 === null)) {
                  break;
                } else {
                  results1["splat"] = res1;
                }
                resV0 = results1;
                break;
              }
              if((resV0 === null)) {
                res0 = null;
                break outer;
              }
              matches0.push(resV0);
              inner:
              while(true) {
                pos5 = code0.pos;
                while(true) {
                  resJ0 = null;
                  pos6 = code0.pos;
                  resJ0 = grammar0["_COMMA"]();
                  if((resJ0 === null)) {
                    code0.pos = pos6;
                  } else {
                    break;
                  }
                  pos6 = code0.pos;
                  resJ0 = grammar0["_COMMA_NEWLINE"]();
                  if((resJ0 === null)) {
                    code0.pos = pos6;
                  } else {
                    break;
                  }
                  break;
                }
                if((resJ0 === null)) {
                  code0.pos = pos5;
                  break inner;
                }
                while(true) {
                  pos6 = code0.pos;
                  temp198 = {
                  };
                  code0.match(temp198);
                  if((res1 === null)) {
                    res1 = undefined;
                    code0.pos = pos6;
                  }
                  if((res1 === null)) {
                    break;
                  } else {
                    results1 = _.extend(res1, results1);
                  }
                  if((res1 === null)) {
                    break;
                  } else {
                    results1["splat"] = res1;
                  }
                  resV0 = results1;
                  break;
                }
                if((resV0 === null)) {
                  code0.pos = pos5;
                  break inner;
                }
                matches0.push(resV0);
              }
              if((1 > matches0.length)) {
                res0 = null;
                code0.pos = pos4;
                break outer;
              }
              break outer;
            }
            res0 = matches0;
            if((res0 === null)) {
              break;
            }
            if((res0 === null)) {
              break;
            } else {
              results0["params"] = res0;
            }
            result0 = results0;
            break;
          }
          if((result0 === null)) {
            code0.pos = pos3;
          } else {
            break;
          }
          pos3 = code0.pos;
          while(true) {
            matches0 = [];
            pos4 = code0.pos;
            outer:
            while(true) {
              resV0 = grammar0["OBJ_IMPL_ITEM"]();
              if((resV0 === null)) {
                res0 = null;
                break outer;
              }
              matches0.push(resV0);
              inner:
              while(true) {
                pos5 = code0.pos;
                while(true) {
                  resJ0 = null;
                  pos6 = code0.pos;
                  resJ0 = grammar0["_COMMA"]();
                  if((resJ0 === null)) {
                    code0.pos = pos6;
                  } else {
                    break;
                  }
                  pos6 = code0.pos;
                  resJ0 = grammar0["_NEWLINE"]();
                  if((resJ0 === null)) {
                    code0.pos = pos6;
                  } else {
                    break;
                  }
                  break;
                }
                if((resJ0 === null)) {
                  code0.pos = pos5;
                  break inner;
                }
                resV0 = grammar0["OBJ_IMPL_ITEM"]();
                if((resV0 === null)) {
                  code0.pos = pos5;
                  break inner;
                }
                matches0.push(resV0);
              }
              if((1 > matches0.length)) {
                res0 = null;
                code0.pos = pos4;
                break outer;
              }
              break outer;
            }
            res0 = matches0;
            result0 = res0;
            if((res0 === null)) {
              result0 = null;
              break;
            }
            break;
          }
          if((result0 === null)) {
            code0.pos = pos3;
          } else {
            break;
          }
          pos3 = code0.pos;
          while(true) {
            result0 = undefined;
            results0 = {
            };
            res0 = grammar0["ASSIGNABLE"]();
            if((res0 === null)) {
              break;
            } else {
              results0["target"] = res0;
            }
            res0 = grammar0["_"]();
            if((res0 === null)) {
              break;
            }
            while(true) {
              res0 = null;
              pos4 = code0.pos;
              temp199 = {
              };
              code0.match(temp199);
              if((res0 === null)) {
                code0.pos = pos4;
              } else {
                break;
              }
              pos4 = code0.pos;
              temp200 = {
              };
              code0.match(temp200);
              if((res0 === null)) {
                code0.pos = pos4;
              } else {
                break;
              }
              pos4 = code0.pos;
              temp201 = {
              };
              code0.match(temp201);
              if((res0 === null)) {
                code0.pos = pos4;
              } else {
                break;
              }
              pos4 = code0.pos;
              temp202 = {
              };
              code0.match(temp202);
              if((res0 === null)) {
                code0.pos = pos4;
              } else {
                break;
              }
              pos4 = code0.pos;
              temp203 = {
              };
              code0.match(temp203);
              if((res0 === null)) {
                code0.pos = pos4;
              } else {
                break;
              }
              pos4 = code0.pos;
              temp204 = {
              };
              code0.match(temp204);
              if((res0 === null)) {
                code0.pos = pos4;
              } else {
                break;
              }
              pos4 = code0.pos;
              temp205 = {
              };
              code0.match(temp205);
              if((res0 === null)) {
                code0.pos = pos4;
              } else {
                break;
              }
              break;
            }
            if((res0 === null)) {
              break;
            } else {
              results0["type"] = res0;
            }
            res0 = grammar0["BLOCKEXPR"]();
            if((res0 === null)) {
              break;
            } else {
              results0["value"] = res0;
            }
            result0 = results0;
            break;
          }
          if((result0 === null)) {
            code0.pos = pos3;
          } else {
            break;
          }
          break;
        }
        if((result0 === null)) {
          code0.pos = pos2;
        } else {
          break;
        }
        pos2 = code0.pos;
        while(true) {
          result0 = null;
          pos3 = code0.pos;
          while(true) {
            pos4 = code0.pos;
            while(true) {
              pos5 = code0.pos;
              while(true) {
                res1 = null;
                pos6 = code0.pos;
                res1 = grammar0["_NEWLINE"]();
                if((res1 === null)) {
                  code0.pos = pos6;
                } else {
                  break;
                }
                pos6 = code0.pos;
                res1 = grammar0["_INDENT"]();
                if((res1 === null)) {
                  code0.pos = pos6;
                } else {
                  break;
                }
                break;
              }
              if((res1 === null)) {
                res1 = undefined;
                code0.pos = pos5;
              }
              if((res1 === null)) {
                break;
              }
              res1 = grammar0["_ELSE"]();
              if((res1 === null)) {
                break;
              }
              res1 = grammar0["BLOCK"]();
              if((res1 === null)) {
                break;
              } else {
                results1["elseBlock"] = res1;
              }
              res0 = results1;
              break;
            }
            if((res0 === null)) {
              res0 = undefined;
              code0.pos = pos4;
            }
            if((res0 === null)) {
              break;
            }
            res0 = grammar0["EXPR"]();
            if((res0 === null)) {
              break;
            } else {
              results0["cond"] = res0;
            }
            res0 = grammar0["BLOCK"]();
            if((res0 === null)) {
              break;
            } else {
              results0["block"] = res0;
            }
            if((res0 === null)) {
              break;
            } else {
              _.extend(results0, res0);
            }
            result0 = results0;
            break;
          }
          if((result0 === null)) {
            code0.pos = pos3;
          } else {
            break;
          }
          pos3 = code0.pos;
          while(true) {
            pos4 = code0.pos;
            while(true) {
              pos5 = code0.pos;
              while(true) {
                res1 = null;
                pos6 = code0.pos;
                res1 = grammar0["_NEWLINE"]();
                if((res1 === null)) {
                  code0.pos = pos6;
                } else {
                  break;
                }
                pos6 = code0.pos;
                res1 = grammar0["_INDENT"]();
                if((res1 === null)) {
                  code0.pos = pos6;
                } else {
                  break;
                }
                break;
              }
              if((res1 === null)) {
                res1 = undefined;
                code0.pos = pos5;
              }
              if((res1 === null)) {
                break;
              }
              res1 = grammar0["_ELSE"]();
              if((res1 === null)) {
                break;
              }
              res1 = grammar0["BLOCK"]();
              if((res1 === null)) {
                break;
              } else {
                results1["elseBlock"] = res1;
              }
              res0 = results1;
              break;
            }
            if((res0 === null)) {
              res0 = undefined;
              code0.pos = pos4;
            }
            if((res0 === null)) {
              break;
            }
            res0 = grammar0["EXPR"]();
            if((res0 === null)) {
              break;
            } else {
              results0["cond"] = res0;
            }
            res0 = grammar0["BLOCK"]();
            if((res0 === null)) {
              break;
            } else {
              results0["block"] = res0;
            }
            if((res0 === null)) {
              break;
            } else {
              _.extend(results0, res0);
            }
            result0 = results0;
            break;
          }
          if((result0 === null)) {
            code0.pos = pos3;
          } else {
            break;
          }
          pos3 = code0.pos;
          while(true) {
            pos4 = code0.pos;
            while(true) {
              res0 = undefined;
              results1 = {
              };
              res1 = grammar0["_WHEN"]();
              if((res1 === null)) {
                break;
              }
              res1 = grammar0["EXPR"]();
              if((res1 === null)) {
                break;
              } else {
                results1["cond"] = res1;
              }
              res0 = results1;
              break;
            }
            if((res0 === null)) {
              res0 = undefined;
              code0.pos = pos4;
            }
            res0 = matches0;
            if((res0 === null)) {
              break;
            } else {
              results0["own"] = res0;
            }
            if((res0 === null)) {
              break;
            } else {
              results0["keys"] = res0;
            }
            while(true) {
              res0 = null;
              pos4 = code0.pos;
              res0 = grammar0["_IN"]();
              if((res0 === null)) {
                code0.pos = pos4;
              } else {
                break;
              }
              pos4 = code0.pos;
              res0 = grammar0["_OF"]();
              if((res0 === null)) {
                code0.pos = pos4;
              } else {
                break;
              }
              break;
            }
            if((res0 === null)) {
              break;
            } else {
              results0["type"] = res0;
            }
            res0 = grammar0["EXPR"]();
            if((res0 === null)) {
              break;
            } else {
              results0["obj"] = res0;
            }
            if((res0 === null)) {
              break;
            } else {
              _.extend(results0, res0);
            }
            res0 = grammar0["BLOCK"]();
            if((res0 === null)) {
              break;
            } else {
              results0["block"] = res0;
            }
            result0 = results0;
            break;
          }
          if((result0 === null)) {
            code0.pos = pos3;
          } else {
            break;
          }
          pos3 = code0.pos;
          while(true) {
            result0 = undefined;
            results0 = {
            };
            res0 = grammar0["_LOOP"]();
            if((res0 === null)) {
              break;
            }
            res0 = grammar0["BLOCK"]();
            if((res0 === null)) {
              break;
            } else {
              results0["block"] = res0;
            }
            result0 = results0;
            break;
          }
          if((result0 === null)) {
            code0.pos = pos3;
          } else {
            break;
          }
          pos3 = code0.pos;
          while(true) {
            result0 = undefined;
            results0 = {
            };
            res0 = grammar0["_WHILE"]();
            if((res0 === null)) {
              break;
            }
            res0 = grammar0["EXPR"]();
            if((res0 === null)) {
              break;
            } else {
              results0["cond"] = res0;
            }
            res0 = grammar0["BLOCK"]();
            if((res0 === null)) {
              break;
            } else {
              results0["block"] = res0;
            }
            result0 = results0;
            break;
          }
          if((result0 === null)) {
            code0.pos = pos3;
          } else {
            break;
          }
          pos3 = code0.pos;
          while(true) {
            pos4 = code0.pos;
            res0 = grammar0["DEFAULT"]();
            if((res0 === null)) {
              res0 = undefined;
              code0.pos = pos4;
            }
            res0 = matches0;
            res0 = grammar0["EXPR"]();
            if((res0 === null)) {
              break;
            } else {
              results0["obj"] = res0;
            }
            res0 = grammar0["_INDENT"]();
            if((res0 === null)) {
              break;
            }
            if((res0 === null)) {
              break;
            } else {
              results0["cases"] = res0;
            }
            if((res0 === null)) {
              break;
            } else {
              results0["default"] = res0;
            }
            result0 = results0;
            break;
          }
          if((result0 === null)) {
            code0.pos = pos3;
          } else {
            break;
          }
          pos3 = code0.pos;
          while(true) {
            pos4 = code0.pos;
            while(true) {
              pos5 = code0.pos;
              res1 = grammar0["_NEWLINE"]();
              if((res1 === null)) {
                res1 = undefined;
                code0.pos = pos5;
              }
              if((res1 === null)) {
                break;
              }
              res1 = grammar0["_FINALLY"]();
              if((res1 === null)) {
                break;
              }
              res1 = grammar0["BLOCK"]();
              if((res1 === null)) {
                break;
              } else {
                results1["finally"] = res1;
              }
              res0 = results1;
              break;
            }
            if((res0 === null)) {
              res0 = undefined;
              code0.pos = pos4;
            }
            if((res0 === null)) {
              break;
            }
            res0 = grammar0["BLOCK"]();
            if((res0 === null)) {
              break;
            } else {
              results0["block"] = res0;
            }
            if((res0 === null)) {
              break;
            } else {
              _.extend(results0, res0);
            }
            if((res0 === null)) {
              break;
            } else {
              _.extend(results0, res0);
            }
            result0 = results0;
            break;
          }
          if((result0 === null)) {
            code0.pos = pos3;
          } else {
            break;
          }
          break;
        }
        if((result0 === null)) {
          code0.pos = pos2;
        } else {
          break;
        }
        pos2 = code0.pos;
        while(true) {
          pos3 = code0.pos;
          while(true) {
            res1 = null;
            pos4 = code0.pos;
            res1 = grammar0["OP00_OP"]();
            if((res1 === null)) {
              code0.pos = pos4;
            } else {
              break;
            }
            pos4 = code0.pos;
            res1 = grammar0["OP05_OP"]();
            if((res1 === null)) {
              code0.pos = pos4;
            } else {
              break;
            }
            pos4 = code0.pos;
            res1 = grammar0["OP10_OP"]();
            if((res1 === null)) {
              code0.pos = pos4;
            } else {
              break;
            }
            pos4 = code0.pos;
            res1 = grammar0["OP20_OP"]();
            if((res1 === null)) {
              code0.pos = pos4;
            } else {
              break;
            }
            pos4 = code0.pos;
            res1 = grammar0["OP30_OP"]();
            if((res1 === null)) {
              code0.pos = pos4;
            } else {
              break;
            }
            break;
          }
          code0.pos = pos3;
          if((res1 !== null)) {
            res0 = null;
          } else {
            res0 = undefined;
          }
          res0 = grammar0["_"]();
          if((res0 === null)) {
            result0 = null;
            break;
          }
          if((res0 === null)) {
            result0 = null;
            break;
          }
          break;
        }
        if((result0 === null)) {
          code0.pos = pos2;
        } else {
          break;
        }
        pos2 = code0.pos;
        while(true) {
          result0 = null;
          pos3 = code0.pos;
          while(true) {
            pos4 = code0.pos;
            res0 = grammar0["_SOFTLINE"]();
            if((res0 === null)) {
              res0 = undefined;
              code0.pos = pos4;
            }
            if((res0 === null)) {
              break;
            } else {
              results0["left"] = res0;
            }
            res0 = grammar0["_"]();
            if((res0 === null)) {
              break;
            }
            res0 = grammar0["OP00_OP"]();
            if((res0 === null)) {
              break;
            } else {
              results0["op"] = res0;
            }
            if((res0 === null)) {
              break;
            }
            res0 = grammar0["OP05"]();
            if((res0 === null)) {
              break;
            } else {
              results0["right"] = res0;
            }
            result0 = results0;
            break;
          }
          if((result0 === null)) {
            code0.pos = pos3;
          } else {
            break;
          }
          pos3 = code0.pos;
          while(true) {
            result0 = null;
            pos4 = code0.pos;
            while(true) {
              pos5 = code0.pos;
              res0 = grammar0["_SOFTLINE"]();
              if((res0 === null)) {
                res0 = undefined;
                code0.pos = pos5;
              }
              if((res0 === null)) {
                break;
              } else {
                results0["left"] = res0;
              }
              res0 = grammar0["_"]();
              if((res0 === null)) {
                break;
              }
              res0 = grammar0["OP05_OP"]();
              if((res0 === null)) {
                break;
              } else {
                results0["op"] = res0;
              }
              if((res0 === null)) {
                break;
              }
              res0 = grammar0["OP10"]();
              if((res0 === null)) {
                break;
              } else {
                results0["right"] = res0;
              }
              result0 = results0;
              break;
            }
            if((result0 === null)) {
              code0.pos = pos4;
            } else {
              break;
            }
            pos4 = code0.pos;
            while(true) {
              result0 = null;
              pos5 = code0.pos;
              while(true) {
                pos6 = code0.pos;
                res0 = grammar0["_SOFTLINE"]();
                if((res0 === null)) {
                  res0 = undefined;
                  code0.pos = pos6;
                }
                if((res0 === null)) {
                  break;
                } else {
                  results0["left"] = res0;
                }
                res0 = grammar0["_"]();
                if((res0 === null)) {
                  break;
                }
                res0 = grammar0["OP10_OP"]();
                if((res0 === null)) {
                  break;
                } else {
                  results0["op"] = res0;
                }
                if((res0 === null)) {
                  break;
                }
                res0 = grammar0["OP20"]();
                if((res0 === null)) {
                  break;
                } else {
                  results0["right"] = res0;
                }
                result0 = results0;
                break;
              }
              if((result0 === null)) {
                code0.pos = pos5;
              } else {
                break;
              }
              pos5 = code0.pos;
              while(true) {
                result0 = null;
                pos6 = code0.pos;
                while(true) {
                  pos7 = code0.pos;
                  res0 = grammar0["_SOFTLINE"]();
                  if((res0 === null)) {
                    res0 = undefined;
                    code0.pos = pos7;
                  }
                  if((res0 === null)) {
                    break;
                  } else {
                    results0["left"] = res0;
                  }
                  res0 = grammar0["_"]();
                  if((res0 === null)) {
                    break;
                  }
                  res0 = grammar0["OP20_OP"]();
                  if((res0 === null)) {
                    break;
                  } else {
                    results0["op"] = res0;
                  }
                  if((res0 === null)) {
                    break;
                  }
                  res0 = grammar0["OP30"]();
                  if((res0 === null)) {
                    break;
                  } else {
                    results0["right"] = res0;
                  }
                  result0 = results0;
                  break;
                }
                if((result0 === null)) {
                  code0.pos = pos6;
                } else {
                  break;
                }
                pos6 = code0.pos;
                while(true) {
                  result0 = null;
                  pos7 = code0.pos;
                  while(true) {
                    pos8 = code0.pos;
                    res0 = grammar0["_SOFTLINE"]();
                    if((res0 === null)) {
                      res0 = undefined;
                      code0.pos = pos8;
                    }
                    if((res0 === null)) {
                      break;
                    } else {
                      results0["left"] = res0;
                    }
                    res0 = grammar0["_"]();
                    if((res0 === null)) {
                      break;
                    }
                    res0 = grammar0["OP30_OP"]();
                    if((res0 === null)) {
                      break;
                    } else {
                      _.extend(results0, res0);
                    }
                    if((res0 === null)) {
                      break;
                    }
                    res0 = grammar0["OP40"]();
                    if((res0 === null)) {
                      break;
                    } else {
                      results0["right"] = res0;
                    }
                    result0 = results0;
                    break;
                  }
                  if((result0 === null)) {
                    code0.pos = pos7;
                  } else {
                    break;
                  }
                  pos7 = code0.pos;
                  while(true) {
                    result0 = null;
                    pos8 = code0.pos;
                    while(true) {
                      result0 = undefined;
                      results0 = {
                      };
                      res0 = grammar0["_"]();
                      if((res0 === null)) {
                        break;
                      }
                      res0 = grammar0["OP40_OP"]();
                      if((res0 === null)) {
                        break;
                      } else {
                        results0["op"] = res0;
                      }
                      res0 = grammar0["OP45"]();
                      if((res0 === null)) {
                        break;
                      } else {
                        results0["right"] = res0;
                      }
                      result0 = results0;
                      break;
                    }
                    if((result0 === null)) {
                      code0.pos = pos8;
                    } else {
                      break;
                    }
                    pos8 = code0.pos;
                    while(true) {
                      result0 = null;
                      pos9 = code0.pos;
                      while(true) {
                        pos10 = code0.pos;
                        res0 = grammar0["_SOFTLINE"]();
                        if((res0 === null)) {
                          res0 = undefined;
                          code0.pos = pos10;
                        }
                        if((res0 === null)) {
                          break;
                        } else {
                          results0["left"] = res0;
                        }
                        res0 = grammar0["_"]();
                        if((res0 === null)) {
                          break;
                        }
                        res0 = grammar0["OP45_OP"]();
                        if((res0 === null)) {
                          break;
                        } else {
                          results0["op"] = res0;
                        }
                        if((res0 === null)) {
                          break;
                        }
                        res0 = grammar0["OP50"]();
                        if((res0 === null)) {
                          break;
                        } else {
                          results0["right"] = res0;
                        }
                        result0 = results0;
                        break;
                      }
                      if((result0 === null)) {
                        code0.pos = pos9;
                      } else {
                        break;
                      }
                      pos9 = code0.pos;
                      while(true) {
                        result0 = null;
                        pos10 = code0.pos;
                        while(true) {
                          result0 = undefined;
                          results0 = {
                          };
                          res0 = grammar0["OPATOM"]();
                          if((res0 === null)) {
                            break;
                          } else {
                            results0["left"] = res0;
                          }
                          res0 = grammar0["OP50_OP"]();
                          if((res0 === null)) {
                            break;
                          } else {
                            results0["op"] = res0;
                          }
                          result0 = results0;
                          break;
                        }
                        if((result0 === null)) {
                          code0.pos = pos10;
                        } else {
                          break;
                        }
                        pos10 = code0.pos;
                        while(true) {
                          result0 = undefined;
                          results0 = {
                          };
                          res0 = grammar0["_"]();
                          if((res0 === null)) {
                            break;
                          }
                          res0 = grammar0["OP50_OP"]();
                          if((res0 === null)) {
                            break;
                          } else {
                            results0["op"] = res0;
                          }
                          res0 = grammar0["OPATOM"]();
                          if((res0 === null)) {
                            break;
                          } else {
                            results0["right"] = res0;
                          }
                          result0 = results0;
                          break;
                        }
                        if((result0 === null)) {
                          code0.pos = pos10;
                        } else {
                          break;
                        }
                        pos10 = code0.pos;
                        while(true) {
                          result0 = null;
                          pos11 = code0.pos;
                          result0 = grammar0["FUNC"]();
                          if((result0 === null)) {
                            code0.pos = pos11;
                          } else {
                            break;
                          }
                          pos11 = code0.pos;
                          result0 = grammar0["RIGHT_RECURSIVE"]();
                          if((result0 === null)) {
                            code0.pos = pos11;
                          } else {
                            break;
                          }
                          pos11 = code0.pos;
                          result0 = grammar0["COMPLEX"]();
                          if((result0 === null)) {
                            code0.pos = pos11;
                          } else {
                            break;
                          }
                          pos11 = code0.pos;
                          result0 = grammar0["ASSIGNABLE"]();
                          if((result0 === null)) {
                            code0.pos = pos11;
                          } else {
                            break;
                          }
                          break;
                        }
                        if((result0 === null)) {
                          code0.pos = pos10;
                        } else {
                          break;
                        }
                        break;
                      }
                      if((result0 === null)) {
                        code0.pos = pos9;
                      } else {
                        break;
                      }
                      break;
                    }
                    if((result0 === null)) {
                      code0.pos = pos8;
                    } else {
                      break;
                    }
                    break;
                  }
                  if((result0 === null)) {
                    code0.pos = pos7;
                  } else {
                    break;
                  }
                  break;
                }
                if((result0 === null)) {
                  code0.pos = pos6;
                } else {
                  break;
                }
                break;
              }
              if((result0 === null)) {
                code0.pos = pos5;
              } else {
                break;
              }
              break;
            }
            if((result0 === null)) {
              code0.pos = pos4;
            } else {
              break;
            }
            break;
          }
          if((result0 === null)) {
            code0.pos = pos3;
          } else {
            break;
          }
          break;
        }
        if((result0 === null)) {
          code0.pos = pos2;
        } else {
          break;
        }
        break;
      }
      if((result0 === null)) {
        code0.pos = pos1;
      } else {
        break;
      }
      break;
    }
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    break;
  }
  return result0;
};
grammar0["ASSIGNABLE"] = function() {
  while(true) {
    result0 = null;
    pos0 = code0.pos;
    while(true) {
      pos1 = code0.pos;
      res1 = grammar0["__"]();
      code0.pos = pos1;
      if((res1 !== null)) {
        res0 = null;
      } else {
        res0 = undefined;
      }
      if((res0 === null)) {
        break;
      }
      res0 = grammar0["RANGE"]();
      if((res0 === null)) {
        break;
      } else {
        results0["range"] = res0;
      }
      result0 = results0;
      break;
    }
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    pos0 = code0.pos;
    while(true) {
      result0 = undefined;
      results0 = {
      };
      res0 = grammar0["ASSIGNABLE"]();
      if((res0 === null)) {
        break;
      } else {
        results0["obj"] = res0;
      }
      temp206 = {
      };
      code0.match(temp206);
      if((res0 === null)) {
        break;
      } else {
        results0["type"] = res0;
      }
      res0 = grammar0["LINEEXPR"]();
      if((res0 === null)) {
        break;
      } else {
        results0["attr"] = res0;
      }
      res0 = grammar0["_"]();
      if((res0 === null)) {
        break;
      }
      temp207 = {
      };
      code0.match(temp207);
      if((res0 === null)) {
        break;
      }
      result0 = results0;
      break;
    }
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    pos0 = code0.pos;
    while(true) {
      result0 = undefined;
      results0 = {
      };
      res0 = grammar0["ASSIGNABLE"]();
      if((res0 === null)) {
        break;
      } else {
        results0["obj"] = res0;
      }
      temp208 = {
      };
      code0.match(temp208);
      if((res0 === null)) {
        break;
      } else {
        results0["type"] = res0;
      }
      res0 = grammar0["WORD"]();
      if((res0 === null)) {
        break;
      } else {
        results0["attr"] = res0;
      }
      result0 = results0;
      break;
    }
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    pos0 = code0.pos;
    while(true) {
      pos1 = code0.pos;
      res0 = grammar0["WORD"]();
      if((res0 === null)) {
        res0 = undefined;
        code0.pos = pos1;
      }
      if((res0 === null)) {
        break;
      } else {
        results0["obj"] = res0;
      }
      temp209 = {
      };
      code0.match(temp209);
      if((res0 === null)) {
        break;
      } else {
        results0["type"] = res0;
      }
      if((res0 === null)) {
        break;
      } else {
        results0["attr"] = res0;
      }
      result0 = results0;
      break;
    }
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    pos0 = code0.pos;
    while(true) {
      matches0 = [];
      pos1 = code0.pos;
      outer:
      while(true) {
        while(true) {
          pos2 = code0.pos;
          temp210 = {
          };
          code0.match(temp210);
          if((res1 === null)) {
            res1 = undefined;
            code0.pos = pos2;
          }
          if((res1 === null)) {
            break;
          } else {
            results1 = _.extend(res1, results1);
          }
          if((res1 === null)) {
            break;
          } else {
            results1["splat"] = res1;
          }
          resV0 = results1;
          break;
        }
        if((resV0 === null)) {
          res0 = [];
          break outer;
        }
        matches0.push(resV0);
        inner:
        while(true) {
          pos2 = code0.pos;
          while(true) {
            resJ0 = null;
            pos3 = code0.pos;
            resJ0 = grammar0["_COMMA"]();
            if((resJ0 === null)) {
              code0.pos = pos3;
            } else {
              break;
            }
            pos3 = code0.pos;
            resJ0 = grammar0["_SOFTLINE"]();
            if((resJ0 === null)) {
              code0.pos = pos3;
            } else {
              break;
            }
            break;
          }
          if((resJ0 === null)) {
            code0.pos = pos2;
            break inner;
          }
          while(true) {
            pos3 = code0.pos;
            temp211 = {
            };
            code0.match(temp211);
            if((res1 === null)) {
              res1 = undefined;
              code0.pos = pos3;
            }
            if((res1 === null)) {
              break;
            } else {
              results1 = _.extend(res1, results1);
            }
            if((res1 === null)) {
              break;
            } else {
              results1["splat"] = res1;
            }
            resV0 = results1;
            break;
          }
          if((resV0 === null)) {
            code0.pos = pos2;
            break inner;
          }
          matches0.push(resV0);
        }
        break outer;
      }
      res0 = matches0;
      temp212 = {
      };
      code0.match(temp212);
      if((res0 === null)) {
        break;
      }
      res0 = grammar0["___"]();
      if((res0 === null)) {
        break;
      }
      if((res0 === null)) {
        break;
      } else {
        results0["params"] = res0;
      }
      res0 = grammar0["___"]();
      if((res0 === null)) {
        break;
      }
      temp213 = {
      };
      code0.match(temp213);
      if((res0 === null)) {
        break;
      }
      result0 = results0;
      break;
    }
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    pos0 = code0.pos;
    while(true) {
      result0 = undefined;
      res0 = grammar0["ASSIGNABLE"]();
      result0 = res0;
      if((res0 === null)) {
        result0 = null;
        break;
      }
      temp214 = {
      };
      code0.match(temp214);
      if((res0 === null)) {
        result0 = null;
        break;
      }
      break;
    }
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    pos0 = code0.pos;
    while(true) {
      result0 = null;
      pos1 = code0.pos;
      while(true) {
        matches0 = [];
        pos2 = code0.pos;
        outer:
        while(true) {
          resV0 = grammar0["LINEEXPR"]();
          if((resV0 === null)) {
            res0 = null;
            break outer;
          }
          matches0.push(resV0);
          inner:
          while(true) {
            pos3 = code0.pos;
            resV0 = grammar0["LINEEXPR"]();
            if((resV0 === null)) {
              code0.pos = pos3;
              break inner;
            }
            matches0.push(resV0);
            if((matches0.length >= 1)) {
              break inner;
            }
          }
          if((1 > matches0.length)) {
            res0 = null;
            code0.pos = pos2;
            break outer;
          }
          break outer;
        }
        res0 = matches0;
        temp215 = {
        };
        code0.match(temp215);
        if((res0 === null)) {
          break;
        }
        res0 = grammar0["___"]();
        if((res0 === null)) {
          break;
        }
        if((res0 === null)) {
          break;
        } else {
          results0["params"] = res0;
        }
        res0 = grammar0["___"]();
        if((res0 === null)) {
          break;
        }
        temp216 = {
        };
        code0.match(temp216);
        if((res0 === null)) {
          break;
        }
        result0 = results0;
        break;
      }
      if((result0 === null)) {
        code0.pos = pos1;
      } else {
        break;
      }
      pos1 = code0.pos;
      while(true) {
        matches0 = [];
        pos2 = code0.pos;
        outer:
        while(true) {
          resV0 = grammar0["LINEEXPR"]();
          if((resV0 === null)) {
            res0 = null;
            break outer;
          }
          matches0.push(resV0);
          inner:
          while(true) {
            pos3 = code0.pos;
            resV0 = grammar0["LINEEXPR"]();
            if((resV0 === null)) {
              code0.pos = pos3;
              break inner;
            }
            matches0.push(resV0);
            if((matches0.length >= 1)) {
              break inner;
            }
          }
          if((1 > matches0.length)) {
            res0 = null;
            code0.pos = pos2;
            break outer;
          }
          break outer;
        }
        res0 = matches0;
        res0 = grammar0["__"]();
        if((res0 === null)) {
          break;
        }
        if((res0 === null)) {
          break;
        } else {
          results0["params"] = res0;
        }
        result0 = results0;
        break;
      }
      if((result0 === null)) {
        code0.pos = pos1;
      } else {
        break;
      }
      break;
    }
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    pos0 = code0.pos;
    while(true) {
      pos1 = code0.pos;
      while(true) {
        res0 = undefined;
        res1 = grammar0["_BY"]();
        if((res1 === null)) {
          res0 = null;
          break;
        }
        res1 = grammar0["EXPR"]();
        res0 = res1;
        if((res1 === null)) {
          res0 = null;
          break;
        }
        break;
      }
      if((res0 === null)) {
        res0 = undefined;
        code0.pos = pos1;
      }
      if((res0 === null)) {
        break;
      }
      temp217 = {
      };
      code0.match(temp217);
      if((res0 === null)) {
        break;
      }
      if((res0 === null)) {
        break;
      } else {
        results0["start"] = res0;
      }
      res0 = grammar0["_"]();
      if((res0 === null)) {
        break;
      }
      while(true) {
        res0 = null;
        pos1 = code0.pos;
        temp218 = {
        };
        code0.match(temp218);
        if((res0 === null)) {
          code0.pos = pos1;
        } else {
          break;
        }
        pos1 = code0.pos;
        temp219 = {
        };
        code0.match(temp219);
        if((res0 === null)) {
          code0.pos = pos1;
        } else {
          break;
        }
        break;
      }
      if((res0 === null)) {
        break;
      } else {
        results0["type"] = res0;
      }
      if((res0 === null)) {
        break;
      } else {
        results0["end"] = res0;
      }
      res0 = grammar0["_"]();
      if((res0 === null)) {
        break;
      }
      temp220 = {
      };
      code0.match(temp220);
      if((res0 === null)) {
        break;
      }
      if((res0 === null)) {
        break;
      } else {
        results0["by"] = res0;
      }
      result0 = results0;
      break;
    }
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    pos0 = code0.pos;
    while(true) {
      matches0 = [];
      pos1 = code0.pos;
      outer:
      while(true) {
        while(true) {
          pos2 = code0.pos;
          temp221 = {
          };
          code0.match(temp221);
          if((res1 === null)) {
            res1 = undefined;
            code0.pos = pos2;
          }
          if((res1 === null)) {
            break;
          } else {
            results0 = _.extend(res1, results0);
          }
          if((res1 === null)) {
            break;
          } else {
            results0["splat"] = res1;
          }
          resV0 = results0;
          break;
        }
        if((resV0 === null)) {
          res0 = [];
          break outer;
        }
        matches0.push(resV0);
        inner:
        while(true) {
          pos2 = code0.pos;
          while(true) {
            resJ0 = null;
            pos3 = code0.pos;
            resJ0 = grammar0["_COMMA"]();
            if((resJ0 === null)) {
              code0.pos = pos3;
            } else {
              break;
            }
            pos3 = code0.pos;
            resJ0 = grammar0["_SOFTLINE"]();
            if((resJ0 === null)) {
              code0.pos = pos3;
            } else {
              break;
            }
            break;
          }
          if((resJ0 === null)) {
            code0.pos = pos2;
            break inner;
          }
          while(true) {
            pos3 = code0.pos;
            temp222 = {
            };
            code0.match(temp222);
            if((res1 === null)) {
              res1 = undefined;
              code0.pos = pos3;
            }
            if((res1 === null)) {
              break;
            } else {
              results0 = _.extend(res1, results0);
            }
            if((res1 === null)) {
              break;
            } else {
              results0["splat"] = res1;
            }
            resV0 = results0;
            break;
          }
          if((resV0 === null)) {
            code0.pos = pos2;
            break inner;
          }
          matches0.push(resV0);
        }
        break outer;
      }
      res0 = matches0;
      if((res0 === null)) {
        result0 = null;
        break;
      }
      if((res0 === null)) {
        result0 = null;
        break;
      }
      result0 = res0;
      if((res0 === null)) {
        result0 = null;
        break;
      }
      res0 = grammar0["___"]();
      if((res0 === null)) {
        result0 = null;
        break;
      }
      temp223 = {
      };
      code0.match(temp223);
      if((res0 === null)) {
        result0 = null;
        break;
      }
      break;
    }
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    pos0 = code0.pos;
    while(true) {
      matches0 = [];
      pos1 = code0.pos;
      outer:
      while(true) {
        resV0 = grammar0["OBJ_EXPL_ITEM"]();
        if((resV0 === null)) {
          res0 = [];
          break outer;
        }
        matches0.push(resV0);
        inner:
        while(true) {
          pos2 = code0.pos;
          while(true) {
            resJ0 = null;
            pos3 = code0.pos;
            resJ0 = grammar0["_COMMA"]();
            if((resJ0 === null)) {
              code0.pos = pos3;
            } else {
              break;
            }
            pos3 = code0.pos;
            resJ0 = grammar0["_SOFTLINE"]();
            if((resJ0 === null)) {
              code0.pos = pos3;
            } else {
              break;
            }
            break;
          }
          if((resJ0 === null)) {
            code0.pos = pos2;
            break inner;
          }
          resV0 = grammar0["OBJ_EXPL_ITEM"]();
          if((resV0 === null)) {
            code0.pos = pos2;
            break inner;
          }
          matches0.push(resV0);
        }
        break outer;
      }
      res0 = matches0;
      if((res0 === null)) {
        result0 = null;
        break;
      }
      if((res0 === null)) {
        result0 = null;
        break;
      }
      result0 = res0;
      if((res0 === null)) {
        result0 = null;
        break;
      }
      res0 = grammar0["___"]();
      if((res0 === null)) {
        result0 = null;
        break;
      }
      temp224 = {
      };
      code0.match(temp224);
      if((res0 === null)) {
        result0 = null;
        break;
      }
      break;
    }
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    pos0 = code0.pos;
    while(true) {
      result0 = undefined;
      res0 = grammar0["_"]();
      if((res0 === null)) {
        result0 = null;
        break;
      }
      temp225 = {
      };
      code0.match(temp225);
      if((res0 === null)) {
        result0 = null;
        break;
      }
      res0 = grammar0["___"]();
      if((res0 === null)) {
        result0 = null;
        break;
      }
      res0 = grammar0["LINEEXPR"]();
      result0 = res0;
      if((res0 === null)) {
        result0 = null;
        break;
      }
      res0 = grammar0["___"]();
      if((res0 === null)) {
        result0 = null;
        break;
      }
      temp226 = {
      };
      code0.match(temp226);
      if((res0 === null)) {
        result0 = null;
        break;
      }
      break;
    }
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    pos0 = code0.pos;
    while(true) {
      result0 = undefined;
      res0 = grammar0["_"]();
      if((res0 === null)) {
        result0 = null;
        break;
      }
      temp227 = {
      };
      code0.match(temp227);
      if((res0 === null)) {
        result0 = null;
        break;
      }
      while(true) {
        res0 = null;
        pos1 = code0.pos;
        res0 = grammar0["WORD"]();
        if((res0 === null)) {
          code0.pos = pos1;
        } else {
          break;
        }
        pos1 = code0.pos;
        res0 = grammar0["STRING"]();
        if((res0 === null)) {
          code0.pos = pos1;
        } else {
          break;
        }
        break;
      }
      result0 = res0;
      if((res0 === null)) {
        result0 = null;
        break;
      }
      break;
    }
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    pos0 = code0.pos;
    while(true) {
      result0 = undefined;
      res0 = grammar0["_"]();
      if((res0 === null)) {
        result0 = null;
        break;
      }
      temp228 = {
      };
      code0.match(temp228);
      if((res0 === null)) {
        result0 = null;
        break;
      }
      break;
    }
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    pos0 = code0.pos;
    while(true) {
      matches0 = [];
      pos1 = code0.pos;
      outer:
      while(true) {
        while(true) {
          pos2 = code0.pos;
          res2 = grammar0["_FSLASH"]();
          code0.pos = pos2;
          if((res2 !== null)) {
            res1 = null;
          } else {
            res1 = undefined;
          }
          if((res1 === null)) {
            resV0 = null;
            break;
          }
          while(true) {
            res1 = null;
            pos2 = code0.pos;
            res1 = grammar0["ESC2"]();
            if((res1 === null)) {
              code0.pos = pos2;
            } else {
              break;
            }
            pos2 = code0.pos;
            res1 = grammar0["."]();
            if((res1 === null)) {
              code0.pos = pos2;
            } else {
              break;
            }
            break;
          }
          resV0 = res1;
          if((res1 === null)) {
            resV0 = null;
            break;
          }
          break;
        }
        if((resV0 === null)) {
          res0 = [];
          break outer;
        }
        matches0.push(resV0);
        inner:
        while(true) {
          pos2 = code0.pos;
          while(true) {
            pos3 = code0.pos;
            res2 = grammar0["_FSLASH"]();
            code0.pos = pos3;
            if((res2 !== null)) {
              res1 = null;
            } else {
              res1 = undefined;
            }
            if((res1 === null)) {
              resV0 = null;
              break;
            }
            while(true) {
              res1 = null;
              pos3 = code0.pos;
              res1 = grammar0["ESC2"]();
              if((res1 === null)) {
                code0.pos = pos3;
              } else {
                break;
              }
              pos3 = code0.pos;
              res1 = grammar0["."]();
              if((res1 === null)) {
                code0.pos = pos3;
              } else {
                break;
              }
              break;
            }
            resV0 = res1;
            if((res1 === null)) {
              resV0 = null;
              break;
            }
            break;
          }
          if((resV0 === null)) {
            code0.pos = pos2;
            break inner;
          }
          matches0.push(resV0);
        }
        break outer;
      }
      res0 = matches0;
      res0 = grammar0["_FSLASH"]();
      if((res0 === null)) {
        break;
      }
      if((res0 === null)) {
        break;
      } else {
        results0 = _.extend(res0, results0);
      }
      res0 = grammar0["_FSLASH"]();
      if((res0 === null)) {
        break;
      }
      temp229 = {
      };
      code0.peek(temp229);
      if((res0 === null)) {
        break;
      }
      temp230 = {
      };
      code0.match(temp230);
      if((res0 === null)) {
        break;
      } else {
        results0["flags"] = res0;
      }
      result0 = results0;
      break;
    }
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    pos0 = code0.pos;
    while(true) {
      result0 = null;
      pos1 = code0.pos;
      while(true) {
        matches0 = [];
        pos2 = code0.pos;
        outer:
        while(true) {
          while(true) {
            pos3 = code0.pos;
            res2 = grammar0["_QUOTE"]();
            code0.pos = pos3;
            if((res2 !== null)) {
              res1 = null;
            } else {
              res1 = undefined;
            }
            if((res1 === null)) {
              resV0 = null;
              break;
            }
            while(true) {
              res1 = null;
              pos3 = code0.pos;
              res1 = grammar0["ESCSTR"]();
              if((res1 === null)) {
                code0.pos = pos3;
              } else {
                break;
              }
              pos3 = code0.pos;
              res1 = grammar0["."]();
              if((res1 === null)) {
                code0.pos = pos3;
              } else {
                break;
              }
              break;
            }
            resV0 = res1;
            if((res1 === null)) {
              resV0 = null;
              break;
            }
            break;
          }
          if((resV0 === null)) {
            res0 = [];
            break outer;
          }
          matches0.push(resV0);
          inner:
          while(true) {
            pos3 = code0.pos;
            while(true) {
              pos4 = code0.pos;
              res2 = grammar0["_QUOTE"]();
              code0.pos = pos4;
              if((res2 !== null)) {
                res1 = null;
              } else {
                res1 = undefined;
              }
              if((res1 === null)) {
                resV0 = null;
                break;
              }
              while(true) {
                res1 = null;
                pos4 = code0.pos;
                res1 = grammar0["ESCSTR"]();
                if((res1 === null)) {
                  code0.pos = pos4;
                } else {
                  break;
                }
                pos4 = code0.pos;
                res1 = grammar0["."]();
                if((res1 === null)) {
                  code0.pos = pos4;
                } else {
                  break;
                }
                break;
              }
              resV0 = res1;
              if((res1 === null)) {
                resV0 = null;
                break;
              }
              break;
            }
            if((resV0 === null)) {
              code0.pos = pos3;
              break inner;
            }
            matches0.push(resV0);
          }
          break outer;
        }
        res0 = matches0;
        if((res0 === null)) {
          result0 = null;
          break;
        }
        result0 = res0;
        if((res0 === null)) {
          result0 = null;
          break;
        }
        res0 = grammar0["_QUOTE"]();
        if((res0 === null)) {
          result0 = null;
          break;
        }
        break;
      }
      if((result0 === null)) {
        code0.pos = pos1;
      } else {
        break;
      }
      pos1 = code0.pos;
      while(true) {
        matches0 = [];
        pos2 = code0.pos;
        outer:
        while(true) {
          while(true) {
            pos3 = code0.pos;
            res2 = grammar0["_TQUOTE"]();
            code0.pos = pos3;
            if((res2 !== null)) {
              res1 = null;
            } else {
              res1 = undefined;
            }
            if((res1 === null)) {
              resV0 = null;
              break;
            }
            while(true) {
              res1 = null;
              pos3 = code0.pos;
              res1 = grammar0["ESCSTR"]();
              if((res1 === null)) {
                code0.pos = pos3;
              } else {
                break;
              }
              pos3 = code0.pos;
              res1 = grammar0["INTERP"]();
              if((res1 === null)) {
                code0.pos = pos3;
              } else {
                break;
              }
              pos3 = code0.pos;
              res1 = grammar0["."]();
              if((res1 === null)) {
                code0.pos = pos3;
              } else {
                break;
              }
              break;
            }
            resV0 = res1;
            if((res1 === null)) {
              resV0 = null;
              break;
            }
            break;
          }
          if((resV0 === null)) {
            res0 = [];
            break outer;
          }
          matches0.push(resV0);
          inner:
          while(true) {
            pos3 = code0.pos;
            while(true) {
              pos4 = code0.pos;
              res2 = grammar0["_TQUOTE"]();
              code0.pos = pos4;
              if((res2 !== null)) {
                res1 = null;
              } else {
                res1 = undefined;
              }
              if((res1 === null)) {
                resV0 = null;
                break;
              }
              while(true) {
                res1 = null;
                pos4 = code0.pos;
                res1 = grammar0["ESCSTR"]();
                if((res1 === null)) {
                  code0.pos = pos4;
                } else {
                  break;
                }
                pos4 = code0.pos;
                res1 = grammar0["INTERP"]();
                if((res1 === null)) {
                  code0.pos = pos4;
                } else {
                  break;
                }
                pos4 = code0.pos;
                res1 = grammar0["."]();
                if((res1 === null)) {
                  code0.pos = pos4;
                } else {
                  break;
                }
                break;
              }
              resV0 = res1;
              if((res1 === null)) {
                resV0 = null;
                break;
              }
              break;
            }
            if((resV0 === null)) {
              code0.pos = pos3;
              break inner;
            }
            matches0.push(resV0);
          }
          break outer;
        }
        res0 = matches0;
        if((res0 === null)) {
          result0 = null;
          break;
        }
        result0 = res0;
        if((res0 === null)) {
          result0 = null;
          break;
        }
        res0 = grammar0["_TQUOTE"]();
        if((res0 === null)) {
          result0 = null;
          break;
        }
        break;
      }
      if((result0 === null)) {
        code0.pos = pos1;
      } else {
        break;
      }
      pos1 = code0.pos;
      while(true) {
        matches0 = [];
        pos2 = code0.pos;
        outer:
        while(true) {
          while(true) {
            pos3 = code0.pos;
            res2 = grammar0["_DQUOTE"]();
            code0.pos = pos3;
            if((res2 !== null)) {
              res1 = null;
            } else {
              res1 = undefined;
            }
            if((res1 === null)) {
              resV0 = null;
              break;
            }
            while(true) {
              res1 = null;
              pos3 = code0.pos;
              res1 = grammar0["ESCSTR"]();
              if((res1 === null)) {
                code0.pos = pos3;
              } else {
                break;
              }
              pos3 = code0.pos;
              res1 = grammar0["INTERP"]();
              if((res1 === null)) {
                code0.pos = pos3;
              } else {
                break;
              }
              pos3 = code0.pos;
              res1 = grammar0["."]();
              if((res1 === null)) {
                code0.pos = pos3;
              } else {
                break;
              }
              break;
            }
            resV0 = res1;
            if((res1 === null)) {
              resV0 = null;
              break;
            }
            break;
          }
          if((resV0 === null)) {
            res0 = [];
            break outer;
          }
          matches0.push(resV0);
          inner:
          while(true) {
            pos3 = code0.pos;
            while(true) {
              pos4 = code0.pos;
              res2 = grammar0["_DQUOTE"]();
              code0.pos = pos4;
              if((res2 !== null)) {
                res1 = null;
              } else {
                res1 = undefined;
              }
              if((res1 === null)) {
                resV0 = null;
                break;
              }
              while(true) {
                res1 = null;
                pos4 = code0.pos;
                res1 = grammar0["ESCSTR"]();
                if((res1 === null)) {
                  code0.pos = pos4;
                } else {
                  break;
                }
                pos4 = code0.pos;
                res1 = grammar0["INTERP"]();
                if((res1 === null)) {
                  code0.pos = pos4;
                } else {
                  break;
                }
                pos4 = code0.pos;
                res1 = grammar0["."]();
                if((res1 === null)) {
                  code0.pos = pos4;
                } else {
                  break;
                }
                break;
              }
              resV0 = res1;
              if((res1 === null)) {
                resV0 = null;
                break;
              }
              break;
            }
            if((resV0 === null)) {
              code0.pos = pos3;
              break inner;
            }
            matches0.push(resV0);
          }
          break outer;
        }
        res0 = matches0;
        if((res0 === null)) {
          result0 = null;
          break;
        }
        result0 = res0;
        if((res0 === null)) {
          result0 = null;
          break;
        }
        res0 = grammar0["_DQUOTE"]();
        if((res0 === null)) {
          result0 = null;
          break;
        }
        break;
      }
      if((result0 === null)) {
        code0.pos = pos1;
      } else {
        break;
      }
      break;
    }
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    pos0 = code0.pos;
    while(true) {
      result0 = null;
      pos1 = code0.pos;
      result0 = grammar0["_TRUE"]();
      if((result0 === null)) {
        code0.pos = pos1;
      } else {
        break;
      }
      pos1 = code0.pos;
      result0 = grammar0["_FALSE"]();
      if((result0 === null)) {
        code0.pos = pos1;
      } else {
        break;
      }
      break;
    }
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    pos0 = code0.pos;
    while(true) {
      result0 = undefined;
      res0 = grammar0["_"]();
      if((res0 === null)) {
        result0 = null;
        break;
      }
      temp231 = {
      };
      code0.peek(temp231);
      if((res0 === null)) {
        result0 = null;
        break;
      }
      temp232 = {
      };
      code0.match(temp232);
      result0 = res0;
      if((res0 === null)) {
        result0 = null;
        break;
      }
      break;
    }
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    pos0 = code0.pos;
    while(true) {
      pos1 = code0.pos;
      res1 = grammar0["_KEYWORD"]();
      code0.pos = pos1;
      if((res1 !== null)) {
        res0 = null;
      } else {
        res0 = undefined;
      }
      if((res0 === null)) {
        result0 = null;
        break;
      }
      res0 = grammar0["WORD"]();
      result0 = res0;
      if((res0 === null)) {
        result0 = null;
        break;
      }
      break;
    }
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    break;
  }
  return result0;
};
grammar0["BLOCK"] = function() {
  while(true) {
    result0 = null;
    pos0 = code0.pos;
    while(true) {
      matches0 = [];
      pos1 = code0.pos;
      outer:
      while(true) {
        resV0 = grammar0["LINE"]();
        if((resV0 === null)) {
          res0 = [];
          break outer;
        }
        matches0.push(resV0);
        inner:
        while(true) {
          pos2 = code0.pos;
          resJ0 = grammar0["_NEWLINE"]();
          if((resJ0 === null)) {
            code0.pos = pos2;
            break inner;
          }
          resV0 = grammar0["LINE"]();
          if((resV0 === null)) {
            code0.pos = pos2;
            break inner;
          }
          matches0.push(resV0);
        }
        break outer;
      }
      res0 = matches0;
      result0 = res0;
      if((res0 === null)) {
        result0 = null;
        break;
      }
      break;
    }
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    pos0 = code0.pos;
    while(true) {
      matches0 = [];
      pos1 = code0.pos;
      outer:
      while(true) {
        resV0 = grammar0["LINE"]();
        if((resV0 === null)) {
          res0 = null;
          break outer;
        }
        matches0.push(resV0);
        inner:
        while(true) {
          pos2 = code0.pos;
          while(true) {
            resJ0 = undefined;
            res1 = grammar0["_"]();
            if((res1 === null)) {
              resJ0 = null;
              break;
            }
            temp233 = {
            };
            code0.match(temp233);
            if((res1 === null)) {
              resJ0 = null;
              break;
            }
            break;
          }
          if((resJ0 === null)) {
            code0.pos = pos2;
            break inner;
          }
          resV0 = grammar0["LINE"]();
          if((resV0 === null)) {
            code0.pos = pos2;
            break inner;
          }
          matches0.push(resV0);
        }
        if((1 > matches0.length)) {
          res0 = null;
          code0.pos = pos1;
          break outer;
        }
        break outer;
      }
      res0 = matches0;
      result0 = res0;
      if((res0 === null)) {
        result0 = null;
        break;
      }
      break;
    }
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    break;
  }
  return result0;
};
grammar0["BLOCKEXPR"] = function() {
  while(true) {
    pos0 = code0.pos;
    res0 = grammar0["_INDENT"]();
    if((res0 === null)) {
      res0 = undefined;
      code0.pos = pos0;
    }
    if((res0 === null)) {
      result0 = null;
      break;
    }
    res0 = grammar0["EXPR"]();
    result0 = res0;
    if((res0 === null)) {
      result0 = null;
      break;
    }
    break;
  }
  return result0;
};
grammar0["_INDENT"] = function() {
  while(true) {
    matches0 = [];
    pos0 = code0.pos;
    outer:
    while(true) {
      resV0 = grammar0["_BLANKLINE"]();
      if((resV0 === null)) {
        res0 = null;
        break outer;
      }
      matches0.push(resV0);
      inner:
      while(true) {
        pos1 = code0.pos;
        resV0 = grammar0["_BLANKLINE"]();
        if((resV0 === null)) {
          code0.pos = pos1;
          break inner;
        }
        matches0.push(resV0);
      }
      if((1 > matches0.length)) {
        res0 = null;
        code0.pos = pos0;
        break outer;
      }
      break outer;
    }
    res0 = matches0;
    if((res0 === null)) {
      break;
    }
    res0 = grammar0["_"]();
    if((res0 === null)) {
      break;
    } else {
      results0 = _.extend(res0, results0);
    }
    result0 = results0;
    break;
  }
  return result0;
};
grammar0["_RESETINDENT"] = function() {
  while(true) {
    matches0 = [];
    pos0 = code0.pos;
    outer:
    while(true) {
      resV0 = grammar0["_BLANKLINE"]();
      if((resV0 === null)) {
        res0 = [];
        break outer;
      }
      matches0.push(resV0);
      inner:
      while(true) {
        pos1 = code0.pos;
        resV0 = grammar0["_BLANKLINE"]();
        if((resV0 === null)) {
          code0.pos = pos1;
          break inner;
        }
        matches0.push(resV0);
      }
      break outer;
    }
    res0 = matches0;
    if((res0 === null)) {
      break;
    }
    res0 = grammar0["_"]();
    if((res0 === null)) {
      break;
    } else {
      results0 = _.extend(res0, results0);
    }
    result0 = results0;
    break;
  }
  return result0;
};
grammar0["_NEWLINE"] = function() {
  while(true) {
    result0 = null;
    pos0 = code0.pos;
    while(true) {
      matches0 = [];
      pos1 = code0.pos;
      outer:
      while(true) {
        resV0 = grammar0["_BLANKLINE"]();
        if((resV0 === null)) {
          res0 = null;
          break outer;
        }
        matches0.push(resV0);
        inner:
        while(true) {
          pos2 = code0.pos;
          resV0 = grammar0["_BLANKLINE"]();
          if((resV0 === null)) {
            code0.pos = pos2;
            break inner;
          }
          matches0.push(resV0);
        }
        if((1 > matches0.length)) {
          res0 = null;
          code0.pos = pos1;
          break outer;
        }
        break outer;
      }
      res0 = matches0;
      if((res0 === null)) {
        break;
      }
      res0 = grammar0["_"]();
      if((res0 === null)) {
        break;
      } else {
        results0 = _.extend(res0, results0);
      }
      result0 = results0;
      break;
    }
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    pos0 = code0.pos;
    while(true) {
      result0 = undefined;
      res0 = grammar0["_"]();
      if((res0 === null)) {
        result0 = null;
        break;
      }
      temp234 = {
      };
      code0.match(temp234);
      if((res0 === null)) {
        result0 = null;
        break;
      }
      break;
    }
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    break;
  }
  return result0;
};
grammar0["_SOFTLINE"] = function() {
  while(true) {
    matches0 = [];
    pos0 = code0.pos;
    outer:
    while(true) {
      resV0 = grammar0["_BLANKLINE"]();
      if((resV0 === null)) {
        res0 = null;
        break outer;
      }
      matches0.push(resV0);
      inner:
      while(true) {
        pos1 = code0.pos;
        resV0 = grammar0["_BLANKLINE"]();
        if((resV0 === null)) {
          code0.pos = pos1;
          break inner;
        }
        matches0.push(resV0);
      }
      if((1 > matches0.length)) {
        res0 = null;
        code0.pos = pos0;
        break outer;
      }
      break outer;
    }
    res0 = matches0;
    if((res0 === null)) {
      break;
    }
    res0 = grammar0["_"]();
    if((res0 === null)) {
      break;
    } else {
      results0 = _.extend(res0, results0);
    }
    result0 = results0;
    break;
  }
  return result0;
};
grammar0["_COMMA"] = function() {
  while(true) {
    matches0 = [];
    pos0 = code0.pos;
    outer:
    while(true) {
      resV0 = grammar0["_BLANKLINE"]();
      if((resV0 === null)) {
        res0 = [];
        break outer;
      }
      matches0.push(resV0);
      inner:
      while(true) {
        pos1 = code0.pos;
        resV0 = grammar0["_BLANKLINE"]();
        if((resV0 === null)) {
          code0.pos = pos1;
          break inner;
        }
        matches0.push(resV0);
      }
      break outer;
    }
    res0 = matches0;
    if((res0 === null)) {
      break;
    } else {
      results0["beforeBlanks"] = res0;
    }
    res0 = grammar0["_"]();
    if((res0 === null)) {
      break;
    } else {
      results0["beforeWS"] = res0;
    }
    temp235 = {
    };
    code0.match(temp235);
    if((res0 === null)) {
      break;
    }
    if((res0 === null)) {
      break;
    } else {
      results0["afterBlanks"] = res0;
    }
    res0 = grammar0["_"]();
    if((res0 === null)) {
      break;
    } else {
      results0["afterWS"] = res0;
    }
    result0 = results0;
    break;
  }
  return result0;
};
grammar0["_COMMA_NEWLINE"] = function() {
  while(true) {
    matches0 = [];
    pos0 = code0.pos;
    outer:
    while(true) {
      resV0 = grammar0["_BLANKLINE"]();
      if((resV0 === null)) {
        res0 = null;
        break outer;
      }
      matches0.push(resV0);
      inner:
      while(true) {
        pos1 = code0.pos;
        resV0 = grammar0["_BLANKLINE"]();
        if((resV0 === null)) {
          code0.pos = pos1;
          break inner;
        }
        matches0.push(resV0);
      }
      if((1 > matches0.length)) {
        res0 = null;
        code0.pos = pos0;
        break outer;
      }
      break outer;
    }
    res0 = matches0;
    if((res0 === null)) {
      break;
    }
    res0 = grammar0["_"]();
    if((res0 === null)) {
      break;
    } else {
      results0 = _.extend(res0, results0);
    }
    result0 = results0;
    break;
  }
  return result0;
};
grammar0["WORD"] = function() {
  while(true) {
    result0 = undefined;
    res0 = grammar0["_"]();
    if((res0 === null)) {
      result0 = null;
      break;
    }
    temp236 = {
    };
    code0.peek(temp236);
    if((res0 === null)) {
      result0 = null;
      break;
    }
    temp237 = {
    };
    code0.match(temp237);
    result0 = res0;
    if((res0 === null)) {
      result0 = null;
      break;
    }
    break;
  }
  return result0;
};
grammar0["_KEYWORD"] = function() {
  while(true) {
    result0 = null;
    pos0 = code0.pos;
    while(true) {
      pos1 = code0.pos;
      temp238 = {
      };
      code0.match(temp238);
      code0.pos = pos1;
      if((res1 !== null)) {
        res0 = null;
      } else {
        res0 = undefined;
      }
      temp239 = {
      };
      code0.match(temp239);
      if((res0 === null)) {
        break;
      } else {
        results0 = _.extend(res0, results0);
      }
      temp240 = {
      };
      code0.peek(temp240);
      if((res0 === null)) {
        break;
      }
      if((res0 === null)) {
        break;
      }
      result0 = results0;
      break;
    }
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    pos0 = code0.pos;
    while(true) {
      pos1 = code0.pos;
      temp241 = {
      };
      code0.match(temp241);
      code0.pos = pos1;
      if((res1 !== null)) {
        res0 = null;
      } else {
        res0 = undefined;
      }
      temp242 = {
      };
      code0.match(temp242);
      if((res0 === null)) {
        break;
      } else {
        results0 = _.extend(res0, results0);
      }
      temp243 = {
      };
      code0.peek(temp243);
      if((res0 === null)) {
        break;
      }
      if((res0 === null)) {
        break;
      }
      result0 = results0;
      break;
    }
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    pos0 = code0.pos;
    while(true) {
      pos1 = code0.pos;
      temp244 = {
      };
      code0.match(temp244);
      code0.pos = pos1;
      if((res1 !== null)) {
        res0 = null;
      } else {
        res0 = undefined;
      }
      temp245 = {
      };
      code0.match(temp245);
      if((res0 === null)) {
        break;
      } else {
        results0 = _.extend(res0, results0);
      }
      temp246 = {
      };
      code0.peek(temp246);
      if((res0 === null)) {
        break;
      }
      if((res0 === null)) {
        break;
      }
      result0 = results0;
      break;
    }
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    pos0 = code0.pos;
    while(true) {
      pos1 = code0.pos;
      temp247 = {
      };
      code0.match(temp247);
      code0.pos = pos1;
      if((res1 !== null)) {
        res0 = null;
      } else {
        res0 = undefined;
      }
      temp248 = {
      };
      code0.match(temp248);
      if((res0 === null)) {
        break;
      } else {
        results0 = _.extend(res0, results0);
      }
      temp249 = {
      };
      code0.peek(temp249);
      if((res0 === null)) {
        break;
      }
      if((res0 === null)) {
        break;
      }
      result0 = results0;
      break;
    }
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    pos0 = code0.pos;
    while(true) {
      pos1 = code0.pos;
      temp250 = {
      };
      code0.match(temp250);
      code0.pos = pos1;
      if((res1 !== null)) {
        res0 = null;
      } else {
        res0 = undefined;
      }
      temp251 = {
      };
      code0.match(temp251);
      if((res0 === null)) {
        break;
      } else {
        results0 = _.extend(res0, results0);
      }
      temp252 = {
      };
      code0.peek(temp252);
      if((res0 === null)) {
        break;
      }
      if((res0 === null)) {
        break;
      }
      result0 = results0;
      break;
    }
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    pos0 = code0.pos;
    while(true) {
      pos1 = code0.pos;
      temp253 = {
      };
      code0.match(temp253);
      code0.pos = pos1;
      if((res1 !== null)) {
        res0 = null;
      } else {
        res0 = undefined;
      }
      temp254 = {
      };
      code0.match(temp254);
      if((res0 === null)) {
        break;
      } else {
        results0 = _.extend(res0, results0);
      }
      temp255 = {
      };
      code0.peek(temp255);
      if((res0 === null)) {
        break;
      }
      if((res0 === null)) {
        break;
      }
      result0 = results0;
      break;
    }
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    pos0 = code0.pos;
    while(true) {
      pos1 = code0.pos;
      temp256 = {
      };
      code0.match(temp256);
      code0.pos = pos1;
      if((res1 !== null)) {
        res0 = null;
      } else {
        res0 = undefined;
      }
      temp257 = {
      };
      code0.match(temp257);
      if((res0 === null)) {
        break;
      } else {
        results0 = _.extend(res0, results0);
      }
      temp258 = {
      };
      code0.peek(temp258);
      if((res0 === null)) {
        break;
      }
      if((res0 === null)) {
        break;
      }
      result0 = results0;
      break;
    }
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    pos0 = code0.pos;
    while(true) {
      pos1 = code0.pos;
      temp259 = {
      };
      code0.match(temp259);
      code0.pos = pos1;
      if((res1 !== null)) {
        res0 = null;
      } else {
        res0 = undefined;
      }
      temp260 = {
      };
      code0.match(temp260);
      if((res0 === null)) {
        break;
      } else {
        results0 = _.extend(res0, results0);
      }
      temp261 = {
      };
      code0.peek(temp261);
      if((res0 === null)) {
        break;
      }
      if((res0 === null)) {
        break;
      }
      result0 = results0;
      break;
    }
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    pos0 = code0.pos;
    while(true) {
      pos1 = code0.pos;
      temp262 = {
      };
      code0.match(temp262);
      code0.pos = pos1;
      if((res1 !== null)) {
        res0 = null;
      } else {
        res0 = undefined;
      }
      temp263 = {
      };
      code0.match(temp263);
      if((res0 === null)) {
        break;
      } else {
        results0 = _.extend(res0, results0);
      }
      temp264 = {
      };
      code0.peek(temp264);
      if((res0 === null)) {
        break;
      }
      if((res0 === null)) {
        break;
      }
      result0 = results0;
      break;
    }
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    pos0 = code0.pos;
    while(true) {
      pos1 = code0.pos;
      temp265 = {
      };
      code0.match(temp265);
      code0.pos = pos1;
      if((res1 !== null)) {
        res0 = null;
      } else {
        res0 = undefined;
      }
      temp266 = {
      };
      code0.match(temp266);
      if((res0 === null)) {
        break;
      } else {
        results0 = _.extend(res0, results0);
      }
      temp267 = {
      };
      code0.peek(temp267);
      if((res0 === null)) {
        break;
      }
      if((res0 === null)) {
        break;
      }
      result0 = results0;
      break;
    }
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    pos0 = code0.pos;
    while(true) {
      pos1 = code0.pos;
      temp268 = {
      };
      code0.match(temp268);
      code0.pos = pos1;
      if((res1 !== null)) {
        res0 = null;
      } else {
        res0 = undefined;
      }
      temp269 = {
      };
      code0.match(temp269);
      if((res0 === null)) {
        break;
      } else {
        results0 = _.extend(res0, results0);
      }
      temp270 = {
      };
      code0.peek(temp270);
      if((res0 === null)) {
        break;
      }
      if((res0 === null)) {
        break;
      }
      result0 = results0;
      break;
    }
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    pos0 = code0.pos;
    while(true) {
      pos1 = code0.pos;
      temp271 = {
      };
      code0.match(temp271);
      code0.pos = pos1;
      if((res1 !== null)) {
        res0 = null;
      } else {
        res0 = undefined;
      }
      temp272 = {
      };
      code0.match(temp272);
      if((res0 === null)) {
        break;
      } else {
        results0 = _.extend(res0, results0);
      }
      temp273 = {
      };
      code0.peek(temp273);
      if((res0 === null)) {
        break;
      }
      if((res0 === null)) {
        break;
      }
      result0 = results0;
      break;
    }
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    pos0 = code0.pos;
    while(true) {
      pos1 = code0.pos;
      temp274 = {
      };
      code0.match(temp274);
      code0.pos = pos1;
      if((res1 !== null)) {
        res0 = null;
      } else {
        res0 = undefined;
      }
      temp275 = {
      };
      code0.match(temp275);
      if((res0 === null)) {
        break;
      } else {
        results0 = _.extend(res0, results0);
      }
      temp276 = {
      };
      code0.peek(temp276);
      if((res0 === null)) {
        break;
      }
      if((res0 === null)) {
        break;
      }
      result0 = results0;
      break;
    }
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    pos0 = code0.pos;
    while(true) {
      pos1 = code0.pos;
      temp277 = {
      };
      code0.match(temp277);
      code0.pos = pos1;
      if((res1 !== null)) {
        res0 = null;
      } else {
        res0 = undefined;
      }
      temp278 = {
      };
      code0.match(temp278);
      if((res0 === null)) {
        break;
      } else {
        results0 = _.extend(res0, results0);
      }
      temp279 = {
      };
      code0.peek(temp279);
      if((res0 === null)) {
        break;
      }
      if((res0 === null)) {
        break;
      }
      result0 = results0;
      break;
    }
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    pos0 = code0.pos;
    while(true) {
      pos1 = code0.pos;
      temp280 = {
      };
      code0.match(temp280);
      code0.pos = pos1;
      if((res1 !== null)) {
        res0 = null;
      } else {
        res0 = undefined;
      }
      temp281 = {
      };
      code0.match(temp281);
      if((res0 === null)) {
        break;
      } else {
        results0 = _.extend(res0, results0);
      }
      temp282 = {
      };
      code0.peek(temp282);
      if((res0 === null)) {
        break;
      }
      if((res0 === null)) {
        break;
      }
      result0 = results0;
      break;
    }
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    pos0 = code0.pos;
    while(true) {
      pos1 = code0.pos;
      temp283 = {
      };
      code0.match(temp283);
      code0.pos = pos1;
      if((res1 !== null)) {
        res0 = null;
      } else {
        res0 = undefined;
      }
      temp284 = {
      };
      code0.match(temp284);
      if((res0 === null)) {
        break;
      } else {
        results0 = _.extend(res0, results0);
      }
      temp285 = {
      };
      code0.peek(temp285);
      if((res0 === null)) {
        break;
      }
      if((res0 === null)) {
        break;
      }
      result0 = results0;
      break;
    }
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    pos0 = code0.pos;
    while(true) {
      pos1 = code0.pos;
      temp286 = {
      };
      code0.match(temp286);
      code0.pos = pos1;
      if((res1 !== null)) {
        res0 = null;
      } else {
        res0 = undefined;
      }
      temp287 = {
      };
      code0.match(temp287);
      if((res0 === null)) {
        break;
      } else {
        results0 = _.extend(res0, results0);
      }
      temp288 = {
      };
      code0.peek(temp288);
      if((res0 === null)) {
        break;
      }
      if((res0 === null)) {
        break;
      }
      result0 = results0;
      break;
    }
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    pos0 = code0.pos;
    while(true) {
      pos1 = code0.pos;
      temp289 = {
      };
      code0.match(temp289);
      code0.pos = pos1;
      if((res1 !== null)) {
        res0 = null;
      } else {
        res0 = undefined;
      }
      temp290 = {
      };
      code0.match(temp290);
      if((res0 === null)) {
        break;
      } else {
        results0 = _.extend(res0, results0);
      }
      temp291 = {
      };
      code0.peek(temp291);
      if((res0 === null)) {
        break;
      }
      if((res0 === null)) {
        break;
      }
      result0 = results0;
      break;
    }
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    pos0 = code0.pos;
    while(true) {
      pos1 = code0.pos;
      temp292 = {
      };
      code0.match(temp292);
      code0.pos = pos1;
      if((res1 !== null)) {
        res0 = null;
      } else {
        res0 = undefined;
      }
      temp293 = {
      };
      code0.match(temp293);
      if((res0 === null)) {
        break;
      } else {
        results0 = _.extend(res0, results0);
      }
      temp294 = {
      };
      code0.peek(temp294);
      if((res0 === null)) {
        break;
      }
      if((res0 === null)) {
        break;
      }
      result0 = results0;
      break;
    }
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    pos0 = code0.pos;
    while(true) {
      pos1 = code0.pos;
      temp295 = {
      };
      code0.match(temp295);
      code0.pos = pos1;
      if((res1 !== null)) {
        res0 = null;
      } else {
        res0 = undefined;
      }
      temp296 = {
      };
      code0.match(temp296);
      if((res0 === null)) {
        break;
      } else {
        results0 = _.extend(res0, results0);
      }
      temp297 = {
      };
      code0.peek(temp297);
      if((res0 === null)) {
        break;
      }
      if((res0 === null)) {
        break;
      }
      result0 = results0;
      break;
    }
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    pos0 = code0.pos;
    while(true) {
      pos1 = code0.pos;
      temp298 = {
      };
      code0.match(temp298);
      code0.pos = pos1;
      if((res1 !== null)) {
        res0 = null;
      } else {
        res0 = undefined;
      }
      temp299 = {
      };
      code0.match(temp299);
      if((res0 === null)) {
        break;
      } else {
        results0 = _.extend(res0, results0);
      }
      temp300 = {
      };
      code0.peek(temp300);
      if((res0 === null)) {
        break;
      }
      if((res0 === null)) {
        break;
      }
      result0 = results0;
      break;
    }
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    pos0 = code0.pos;
    while(true) {
      pos1 = code0.pos;
      temp301 = {
      };
      code0.match(temp301);
      code0.pos = pos1;
      if((res1 !== null)) {
        res0 = null;
      } else {
        res0 = undefined;
      }
      temp302 = {
      };
      code0.match(temp302);
      if((res0 === null)) {
        break;
      } else {
        results0 = _.extend(res0, results0);
      }
      temp303 = {
      };
      code0.peek(temp303);
      if((res0 === null)) {
        break;
      }
      if((res0 === null)) {
        break;
      }
      result0 = results0;
      break;
    }
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    pos0 = code0.pos;
    while(true) {
      pos1 = code0.pos;
      temp304 = {
      };
      code0.match(temp304);
      code0.pos = pos1;
      if((res1 !== null)) {
        res0 = null;
      } else {
        res0 = undefined;
      }
      temp305 = {
      };
      code0.match(temp305);
      if((res0 === null)) {
        break;
      } else {
        results0 = _.extend(res0, results0);
      }
      temp306 = {
      };
      code0.peek(temp306);
      if((res0 === null)) {
        break;
      }
      if((res0 === null)) {
        break;
      }
      result0 = results0;
      break;
    }
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    pos0 = code0.pos;
    while(true) {
      pos1 = code0.pos;
      temp307 = {
      };
      code0.match(temp307);
      code0.pos = pos1;
      if((res1 !== null)) {
        res0 = null;
      } else {
        res0 = undefined;
      }
      temp308 = {
      };
      code0.match(temp308);
      if((res0 === null)) {
        break;
      } else {
        results0 = _.extend(res0, results0);
      }
      temp309 = {
      };
      code0.peek(temp309);
      if((res0 === null)) {
        break;
      }
      if((res0 === null)) {
        break;
      }
      result0 = results0;
      break;
    }
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    pos0 = code0.pos;
    while(true) {
      pos1 = code0.pos;
      temp310 = {
      };
      code0.match(temp310);
      code0.pos = pos1;
      if((res1 !== null)) {
        res0 = null;
      } else {
        res0 = undefined;
      }
      temp311 = {
      };
      code0.match(temp311);
      if((res0 === null)) {
        break;
      } else {
        results0 = _.extend(res0, results0);
      }
      temp312 = {
      };
      code0.peek(temp312);
      if((res0 === null)) {
        break;
      }
      if((res0 === null)) {
        break;
      }
      result0 = results0;
      break;
    }
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    pos0 = code0.pos;
    while(true) {
      pos1 = code0.pos;
      temp313 = {
      };
      code0.match(temp313);
      code0.pos = pos1;
      if((res1 !== null)) {
        res0 = null;
      } else {
        res0 = undefined;
      }
      temp314 = {
      };
      code0.match(temp314);
      if((res0 === null)) {
        break;
      } else {
        results0 = _.extend(res0, results0);
      }
      temp315 = {
      };
      code0.peek(temp315);
      if((res0 === null)) {
        break;
      }
      if((res0 === null)) {
        break;
      }
      result0 = results0;
      break;
    }
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    pos0 = code0.pos;
    while(true) {
      pos1 = code0.pos;
      temp316 = {
      };
      code0.match(temp316);
      code0.pos = pos1;
      if((res1 !== null)) {
        res0 = null;
      } else {
        res0 = undefined;
      }
      temp317 = {
      };
      code0.match(temp317);
      if((res0 === null)) {
        break;
      } else {
        results0 = _.extend(res0, results0);
      }
      temp318 = {
      };
      code0.peek(temp318);
      if((res0 === null)) {
        break;
      }
      if((res0 === null)) {
        break;
      }
      result0 = results0;
      break;
    }
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    pos0 = code0.pos;
    while(true) {
      pos1 = code0.pos;
      temp319 = {
      };
      code0.match(temp319);
      code0.pos = pos1;
      if((res1 !== null)) {
        res0 = null;
      } else {
        res0 = undefined;
      }
      temp320 = {
      };
      code0.match(temp320);
      if((res0 === null)) {
        break;
      } else {
        results0 = _.extend(res0, results0);
      }
      temp321 = {
      };
      code0.peek(temp321);
      if((res0 === null)) {
        break;
      }
      if((res0 === null)) {
        break;
      }
      result0 = results0;
      break;
    }
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    pos0 = code0.pos;
    while(true) {
      pos1 = code0.pos;
      temp322 = {
      };
      code0.match(temp322);
      code0.pos = pos1;
      if((res1 !== null)) {
        res0 = null;
      } else {
        res0 = undefined;
      }
      temp323 = {
      };
      code0.match(temp323);
      if((res0 === null)) {
        break;
      } else {
        results0 = _.extend(res0, results0);
      }
      temp324 = {
      };
      code0.peek(temp324);
      if((res0 === null)) {
        break;
      }
      if((res0 === null)) {
        break;
      }
      result0 = results0;
      break;
    }
    if((result0 === null)) {
      code0.pos = pos0;
    } else {
      break;
    }
    break;
  }
  return result0;
};
grammar0["_QUOTE"] = function() {
  temp325 = {
  };
  code0.match(temp325);
  return result0;
};
grammar0["_DQUOTE"] = function() {
  temp326 = {
  };
  code0.match(temp326);
  return result0;
};
grammar0["_TQUOTE"] = function() {
  temp327 = {
  };
  code0.match(temp327);
  return result0;
};
grammar0["_FSLASH"] = function() {
  temp328 = {
  };
  code0.match(temp328);
  return result0;
};
grammar0["_SLASH"] = function() {
  temp329 = {
  };
  code0.match(temp329);
  return result0;
};
grammar0["."] = function() {
  while(true) {
    result0 = undefined;
    temp330 = {
    };
    code0.peek(temp330);
    if((res0 === null)) {
      result0 = null;
      break;
    }
    temp331 = {
    };
    code0.match(temp331);
    result0 = res0;
    if((res0 === null)) {
      result0 = null;
      break;
    }
    break;
  }
  return result0;
};
grammar0["ESC1"] = function() {
  while(true) {
    result0 = undefined;
    res0 = grammar0["_SLASH"]();
    if((res0 === null)) {
      result0 = null;
      break;
    }
    res0 = grammar0["."]();
    result0 = res0;
    if((res0 === null)) {
      result0 = null;
      break;
    }
    break;
  }
  return result0;
};
grammar0["ESC2"] = function() {
  while(true) {
    result0 = undefined;
    res0 = grammar0["_SLASH"]();
    if((res0 === null)) {
      result0 = null;
      break;
    }
    res0 = grammar0["."]();
    result0 = res0;
    if((res0 === null)) {
      result0 = null;
      break;
    }
    break;
  }
  return result0;
};
grammar0["_"] = function() {
  while(true) {
    result0 = undefined;
    temp332 = {
    };
    code0.peek(temp332);
    if((res0 === null)) {
      result0 = null;
      break;
    }
    temp333 = {
    };
    code0.match(temp333);
    result0 = res0;
    if((res0 === null)) {
      result0 = null;
      break;
    }
    break;
  }
  return result0;
};
grammar0["__"] = function() {
  while(true) {
    result0 = undefined;
    temp334 = {
    };
    code0.peek(temp334);
    if((res0 === null)) {
      result0 = null;
      break;
    }
    temp335 = {
    };
    code0.match(temp335);
    result0 = res0;
    if((res0 === null)) {
      result0 = null;
      break;
    }
    break;
  }
  return result0;
};
grammar0["_TERM"] = function() {
  while(true) {
    result0 = undefined;
    res0 = grammar0["_"]();
    if((res0 === null)) {
      result0 = null;
      break;
    }
    while(true) {
      res0 = null;
      pos0 = code0.pos;
      temp336 = {
      };
      code0.match(temp336);
      if((res0 === null)) {
        code0.pos = pos0;
      } else {
        break;
      }
      pos0 = code0.pos;
      temp337 = {
      };
      code0.match(temp337);
      if((res0 === null)) {
        code0.pos = pos0;
      } else {
        break;
      }
      break;
    }
    if((res0 === null)) {
      result0 = null;
      break;
    }
    break;
  }
  return result0;
};
grammar0["_COMMENT"] = function() {
  while(true) {
    matches0 = [];
    pos0 = code0.pos;
    outer:
    while(true) {
      while(true) {
        pos1 = code0.pos;
        res2 = grammar0["_TERM"]();
        code0.pos = pos1;
        if((res2 !== null)) {
          res1 = null;
        } else {
          res1 = undefined;
        }
        if((res1 === null)) {
          resV0 = null;
          break;
        }
        res1 = grammar0["."]();
        resV0 = res1;
        if((res1 === null)) {
          resV0 = null;
          break;
        }
        break;
      }
      if((resV0 === null)) {
        res0 = [];
        break outer;
      }
      matches0.push(resV0);
      inner:
      while(true) {
        pos1 = code0.pos;
        while(true) {
          pos2 = code0.pos;
          res2 = grammar0["_TERM"]();
          code0.pos = pos2;
          if((res2 !== null)) {
            res1 = null;
          } else {
            res1 = undefined;
          }
          if((res1 === null)) {
            resV0 = null;
            break;
          }
          res1 = grammar0["."]();
          resV0 = res1;
          if((res1 === null)) {
            resV0 = null;
            break;
          }
          break;
        }
        if((resV0 === null)) {
          code0.pos = pos1;
          break inner;
        }
        matches0.push(resV0);
      }
      break outer;
    }
    res0 = matches0;
    if((res0 === null)) {
      result0 = null;
      break;
    }
    temp338 = {
    };
    code0.match(temp338);
    if((res0 === null)) {
      result0 = null;
      break;
    }
    result0 = res0;
    if((res0 === null)) {
      result0 = null;
      break;
    }
    break;
  }
  return result0;
};
grammar0["_BLANKLINE"] = function() {
  while(true) {
    pos0 = code0.pos;
    res0 = grammar0["_COMMENT"]();
    if((res0 === null)) {
      res0 = undefined;
      code0.pos = pos0;
    }
    if((res0 === null)) {
      result0 = null;
      break;
    }
    res0 = grammar0["_TERM"]();
    if((res0 === null)) {
      result0 = null;
      break;
    }
    break;
  }
  return result0;
};
grammar0["___"] = function() {
  while(true) {
    matches0 = [];
    pos0 = code0.pos;
    outer:
    while(true) {
      resV0 = grammar0["_BLANKLINE"]();
      if((resV0 === null)) {
        res0 = [];
        break outer;
      }
      matches0.push(resV0);
      inner:
      while(true) {
        pos1 = code0.pos;
        resV0 = grammar0["_BLANKLINE"]();
        if((resV0 === null)) {
          code0.pos = pos1;
          break inner;
        }
        matches0.push(resV0);
      }
      break outer;
    }
    res0 = matches0;
    if((res0 === null)) {
      result0 = null;
      break;
    }
    res0 = grammar0["_"]();
    if((res0 === null)) {
      result0 = null;
      break;
    }
    break;
  }
  return result0;
};
result0 = null;
while(true) {
  result0 = null;
  pos0 = code0.pos;
  while(true) {
    matches0 = [];
    pos1 = code0.pos;
    outer:
    while(true) {
      resV0 = grammar0["_BLANKLINE"]();
      if((resV0 === null)) {
        res0 = [];
        break outer;
      }
      matches0.push(resV0);
      inner:
      while(true) {
        pos2 = code0.pos;
        resV0 = grammar0["_BLANKLINE"]();
        if((resV0 === null)) {
          code0.pos = pos2;
          break inner;
        }
        matches0.push(resV0);
      }
      break outer;
    }
    res0 = matches0;
    if((res0 === null)) {
      result0 = null;
      break;
    }
    res0 = grammar0["LINES"]();
    result0 = res0;
    if((res0 === null)) {
      result0 = null;
      break;
    }
    res0 = grammar0["___"]();
    if((res0 === null)) {
      result0 = null;
      break;
    }
    break;
  }
  if((result0 === null)) {
    code0.pos = pos0;
  } else {
    break;
  }
  break;
}
