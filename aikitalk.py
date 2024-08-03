import configparser
import os
import random


speech_dict = {
    'age': 'à gué',
    'ai': 'aille',
    'aiki': 'aïki',
    'chudan': 'tchoudanne',
    'giri': 'guiri',
    'hiji': 'hidji',
    'ikkyo': 'ikyo',
    'ju': 'jou',
    'katate': 'kataté',
    'kaiten': 'kaïtenn',
    'kime': 'kimé',
    'kote': 'koté',
    'nage': 'nagué',
    'omote': 'omoté',
    'ryote': 'rioté',
    'tachi': 'tatchi',
    'tenchi': 'tènchi',
    'uchi': 'outchi',
    'ude': 'ouder',
    'ura': 'oura',
    'ushiro': 'ouchiro'
}

global config


def _get_speech_of_word(word: str) -> str:
    """
    A dictionary associates a word with its properly pronounced equivalent.
    If the word is properly pronounced by default, it is returned as is.
    :param word: the word to be said
    :return: the word changed to be properly pronounced
    """
    try:
        return speech_dict[word.lower()]
    except KeyError:
        return word


def get_speech_of_sentence(sentence: str) -> str:
    """
    Returns the properly pronounceable sentence from a written one.
    :param sentence: the sentence got from the UI
    :return: the sentence modified so that it is properly pronounced
    """
    speech = ""
    for word in sentence.split():
        speech = speech + " " + _get_speech_of_word(word)
    return speech


def get_grades_files(app_root_path: str):
    """
    Scans the INI files folder and builds the list of files beginning with 'kyu' or 'dan'.
    :param app_root_path: the WEB app root path
    :return: the list of grades found in the form: kyu5, kyu4, ..., dan3, dan4.
    """
    ini_files_dir = os.path.join(app_root_path, 'static', 'ini_files')
    grades_files = []
    for file in os.listdir(ini_files_dir):
        if file.endswith(".ini") and (file.startswith("kyu") or file.startswith("dan")):
            grades_files.append(file)
    return sorted(grades_files)


def parse_config(app_root_path: str, ini_file_name: str):
    global config
    config = configparser.ConfigParser()
    config.read(os.path.join(app_root_path, 'static', 'ini_files', ini_file_name))
    data = {section: {k.capitalize(): [tech.strip().capitalize() for tech in v.split(',')] for k, v in dict(config.items(section)).items()} for section in config.sections()}
    return data


def set_configuration(app_root_path: str, ini_file_name: str):
    """
    Configures the app by reading an initialization file.
    :param app_root_path: the WEB app root path
    :param ini_file_name: the app initialization file name
    """
    global config
    config = configparser.ConfigParser()
    config.read(os.path.join(app_root_path, 'static', 'ini_files', ini_file_name))


def get_wazas_list() -> list:
    """
    Returns the list of wazas read from the initialization file.
    The wazas are the sections of the file.
    :return: the list of wazas
    """
    global config
    return config.sections()


def get_attacks_list(waza: str) -> list:
    """
    Given a waza, returns the list of possible attacks.
    :param waza: user selected waza
    :return: the list of possible attacks in the selected waza
    """
    global config
    attacks = []
    for attack in config[waza]:
        attacks.append(attack.capitalize())

    return attacks


def get_techniques_list(waza: str, attack: str, randomize: int) -> list:
    """
    Given a situation and an attack, returns the list of executable techniques
    from the INI file.
    :param waza: selected situation
    :param attack: selected attack
    :param randomize: if set, the order of techniques is randomized
    :return list of applicable techniques in this situation, on this attack
    """
    # TODO: if ju wazas present in list, they should be asked after all other techniques
    # TODO: even if randomize is set
    global config
    techs = config[waza][attack].replace('\n', '').split(',')

    if randomize:
        random.shuffle(techs)

    return techs
