/*! @preserve
 * any-json
 *
 * Copyright 2015-2016 Christian Zangl, MIT license
 * Details and documentation:
 * https://github.com/laktak/any-json
 */

import * as cson from 'cson';
import * as ini from 'ini';
import * as json5 from 'json5';
import * as util from 'util';
import strip_json_comments = require('strip-json-comments');
import * as XLSX from 'xlsx';
import * as xml2js from 'xml2js';
import * as yaml from 'js-yaml';

function removeLeadingDot(formatOrExtension: string) {
  if (formatOrExtension && formatOrExtension[0] === ".") return formatOrExtension.substr(1);
  else return formatOrExtension;
}

function getEncoding(format: string) {
  format = removeLeadingDot(format);
  switch (format) {
    case "xlsx": return "binary";
    case "xls": return "binary";
    default: return "utf8";
  }
}

interface Format {
  readonly name: string
  encode(value: any): Promise<string | Buffer>
  decode(text: string, reviver?: (key: any, value: any) => any): Promise<any>
}

class CsonConverter implements Format {
  readonly name: string = 'cson'

  public async encode(value: any) {
    return cson.stringify(value, undefined, 2)
  }

  public async decode(text: string, reviver?: (key: any, value: any) => any): Promise<any> {
    return cson.parse(text, reviver)
  }
}

class IniConverter implements Format {
  readonly name: string = 'ini'

  public async encode(value: any) {
    return ini.stringify(value)
  }

  public async decode(text: string, reviver?: (key: any, value: any) => any): Promise<any> {
    return ini.parse(text)
  }
}

class JsonConverter implements Format {
  readonly name: string = 'json'

  public async encode(value: any) {
    return JSON.stringify(value, null, 4)
  }

  public async decode(text: string, reviver?: (key: any, value: any) => any): Promise<any> {
    return JSON.parse(strip_json_comments(text), reviver)
  }
}


class Json5Converter implements Format {
  readonly name: string = 'json5'

  public async encode(value: any) {
    return json5.stringify(value, null, 4)
  }

  public async decode(text: string, reviver?: (key: any, value: any) => any): Promise<any> {
    return json5.parse(text, reviver)
  }
}

class YamlConverter implements Format {
  readonly name: string = 'yaml'

  public async encode(value: any) {
    return yaml.safeDump(value)
  }

  public async decode(text: string, reviver?: (key: any, value: any) => any): Promise<any> {
    return yaml.safeLoad(text)
  }
}

const codecs = [
  new CsonConverter(),
  new IniConverter(),
  new JsonConverter(),
  new Json5Converter(),
  new YamlConverter()
]

/**
 * Parse the given text with the specified format
 * @param text The original text
 * @param format The original format
 * @returns The parsed object
 */
export async function convert(text: string, format: string): Promise<any> {
  format = removeLeadingDot(format);
  if (!format) throw new Error("Missing format!");

  var parse = await decode(format.toLowerCase(), text);
  if (parse) return parse(text);
  else throw new Error("Unknown format " + format + "!");
}

export async function decode(format: string, text: string, reviver?: (key: any, value: any) => any): Promise<any> {
  const codec = codecs.find(x => x.name === format)

  if (codec) {
    return codec.decode(text, reviver);
  }

  throw new Error("Unknown format " + format + "!");
}

export async function encode(value: any, format: string): Promise<string> {
  const codec = codecs.find(x => x.name === format)

  if (codec) {
    return codec.encode(value);
  }

  throw new Error("Unknown format " + format + "!");
}